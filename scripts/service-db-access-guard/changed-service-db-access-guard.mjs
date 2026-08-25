#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import ts from "typescript";

import { parseChangedFileLineMap } from "../repository-domain-guard/changed-repository-domain-guard.mjs";

const DEFAULT_CHANGED_FROM = "origin/dev";
const DEFAULT_SOURCE = "packages/api/src";
const MODEL_OPERATIONS = new Set([
  "aggregate",
  "count",
  "create",
  "createMany",
  "createManyAndReturn",
  "delete",
  "deleteMany",
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "findUnique",
  "findUniqueOrThrow",
  "groupBy",
  "update",
  "updateMany",
  "updateManyAndReturn",
  "upsert",
]);
const ROOT_OPERATIONS = new Set([
  "$executeRaw",
  "$executeRawUnsafe",
  "$queryRaw",
  "$queryRawUnsafe",
  "$transaction",
]);

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  const repoRoot = process.cwd();
  const baseRef = resolveBaseRef(args.changedFrom, repoRoot);
  const diffText = readDiff({
    baseRef,
    repoRoot,
    sourcePath: args.source,
  });
  const violations = findChangedServiceDbAccessViolations({
    changedFiles: parseChangedFileLineMap(diffText),
    repoRoot,
  });

  if (violations.length === 0) {
    console.log(
      `No service DB access guard violations found relative to ${args.changedFrom}.`,
    );
    return;
  }

  console.error(formatViolations(violations));
  process.exitCode = 1;
}

export function findChangedServiceDbAccessViolations({
  changedFiles,
  repoRoot = process.cwd(),
}) {
  const violations = [];

  for (const changedFile of changedFiles) {
    if (!isApiServiceProductionFile(changedFile.path)) {
      continue;
    }

    const currentPath = path.resolve(repoRoot, changedFile.path);
    if (!fs.existsSync(currentPath)) {
      continue;
    }

    const result = findServiceDbAccessNodes({
      sourceText: fs.readFileSync(currentPath, "utf8"),
      filePath: changedFile.path,
    });

    if (result.parseError) {
      violations.push({
        filePath: changedFile.path,
        ...result.parseError,
        kind: "parse-error",
        detected: "TypeScript parse error",
      });
      continue;
    }

    for (const node of result.nodes) {
      if (!lineRangesOverlapAny(node, changedFile.addedRanges)) {
        continue;
      }

      violations.push({ filePath: changedFile.path, ...node });
    }
  }

  return violations.sort(compareViolations);
}

export function findServiceDbAccessNodes({ sourceText, filePath }) {
  const sourceFile = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );

  if (sourceFile.parseDiagnostics.length > 0) {
    const diagnostic = sourceFile.parseDiagnostics[0];
    const position = sourceFile.getLineAndCharacterOfPosition(
      diagnostic.start ?? 0,
    );
    return {
      nodes: [],
      parseError: {
        line: position.line + 1,
        column: position.character + 1,
        reason: ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"),
      },
    };
  }

  const clientProperties = findClientProperties(sourceFile);
  const aliases = buildAliasIndex(sourceFile, clientProperties);
  const nodes = [];
  const record = (node, expression) => {
    const position = sourceFile.getLineAndCharacterOfPosition(
      node.getStart(sourceFile),
    );
    const end = sourceFile.getLineAndCharacterOfPosition(node.end);
    nodes.push({
      line: position.line + 1,
      column: position.character + 1,
      startLine: position.line + 1,
      endLine: end.line + 1,
      kind: "service-direct-db-access",
      detected: expression.getText(sourceFile),
      reason:
        "service methods must call repository commands instead of accessing Prisma or TransactionHost.tx directly",
    });
  };

  const visit = node => {
    if (ts.isCallExpression(node)) {
      const call = getDirectDbCall(node.expression, aliases, clientProperties);
      if (call) {
        record(node, node.expression);
      }
    }
    if (ts.isTaggedTemplateExpression(node)) {
      const call = getDirectDbCall(node.tag, aliases, clientProperties);
      if (call) {
        record(node, node.tag);
      }
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);

  return {
    nodes: dedupeNodes(nodes),
    parseError: null,
  };
}

function findClientProperties(sourceFile) {
  const prisma = new Set(["prisma"]);
  const transactionHosts = new Set(["txHost"]);

  const visit = node => {
    if (
      (ts.isParameter(node) || ts.isPropertyDeclaration(node)) &&
      ts.isIdentifier(node.name)
    ) {
      const typeName = getTypeName(node.type);
      if (typeName === "PrismaService" || typeName === "PrismaClient") {
        prisma.add(node.name.text);
      }
      if (typeName === "TransactionHost") {
        transactionHosts.add(node.name.text);
      }
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return { prisma, transactionHosts };
}

function buildAliasIndex(sourceFile, clientProperties) {
  const rootAliases = new Set(["prisma", "tx"]);
  const delegateAliases = new Map();

  const visit = node => {
    if (ts.isVariableDeclaration(node) && node.initializer) {
      const initializer = unwrapExpression(node.initializer);

      if (ts.isIdentifier(node.name)) {
        const delegate = getDelegateFromExpression(
          initializer,
          rootAliases,
          clientProperties,
        );

        if (delegate) {
          delegateAliases.set(node.name.text, delegate);
        } else if (
          isRootExpression(initializer, rootAliases, clientProperties)
        ) {
          rootAliases.add(node.name.text);
        }
      } else if (ts.isObjectBindingPattern(node.name)) {
        if (isTransactionHostExpression(initializer, clientProperties)) {
          for (const element of node.name.elements) {
            if (!ts.isIdentifier(element.name)) continue;
            const propertyName = element.propertyName
              ? getStaticName(element.propertyName)
              : element.name.text;
            if (propertyName === "tx") {
              rootAliases.add(element.name.text);
            }
          }
        } else if (
          isRootExpression(initializer, rootAliases, clientProperties)
        ) {
          for (const element of node.name.elements) {
            if (!ts.isIdentifier(element.name)) continue;
            const propertyName = element.propertyName
              ? getStaticName(element.propertyName)
              : element.name.text;
            if (propertyName) {
              delegateAliases.set(element.name.text, propertyName);
            }
          }
        }
      }
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return { rootAliases, delegateAliases };
}

function getDirectDbCall(expression, aliases, clientProperties) {
  if (!isStaticAccessExpression(expression)) {
    return null;
  }

  const chain = getAccessChain(expression);
  if (chain.length === 0) {
    return null;
  }

  const delegateAlias = aliases.delegateAliases.get(chain[0]);
  if (delegateAlias && chain.length === 2 && MODEL_OPERATIONS.has(chain[1])) {
    return { operation: chain[1] };
  }

  const rootLength = getRootLength(
    chain,
    aliases.rootAliases,
    clientProperties,
  );
  if (rootLength === 0) {
    return null;
  }

  const remainder = chain.slice(rootLength);
  if (remainder.length === 1 && ROOT_OPERATIONS.has(remainder[0])) {
    return { operation: remainder[0] };
  }
  if (remainder.length === 2 && MODEL_OPERATIONS.has(remainder[1])) {
    return { operation: remainder[1] };
  }

  return null;
}

function getDelegateFromExpression(expression, rootAliases, clientProperties) {
  if (!isStaticAccessExpression(expression)) {
    return "";
  }

  const chain = getAccessChain(expression);
  const rootLength = getRootLength(chain, rootAliases, clientProperties);
  const remainder = chain.slice(rootLength);
  return rootLength > 0 && remainder.length === 1 ? remainder[0] : "";
}

function isRootExpression(expression, rootAliases, clientProperties) {
  if (ts.isIdentifier(expression)) {
    return rootAliases.has(expression.text);
  }
  if (!isStaticAccessExpression(expression)) {
    return false;
  }

  const chain = getAccessChain(expression);
  return getRootLength(chain, rootAliases, clientProperties) === chain.length;
}

function isTransactionHostExpression(expression, clientProperties) {
  if (!isStaticAccessExpression(expression)) {
    return false;
  }
  const chain = getAccessChain(expression);
  return (
    chain.length === 2 &&
    chain[0] === "this" &&
    clientProperties.transactionHosts.has(chain[1])
  );
}

function getRootLength(chain, rootAliases, clientProperties) {
  if (chain.length > 0 && rootAliases.has(chain[0])) {
    return 1;
  }
  if (
    chain.length >= 2 &&
    chain[0] === "this" &&
    clientProperties.prisma.has(chain[1])
  ) {
    return 2;
  }
  if (
    chain.length >= 3 &&
    chain[0] === "this" &&
    clientProperties.transactionHosts.has(chain[1]) &&
    chain[2] === "tx"
  ) {
    return 3;
  }
  return 0;
}

function getTypeName(typeNode) {
  if (!typeNode || !ts.isTypeReferenceNode(typeNode)) {
    return "";
  }

  const typeName = typeNode.typeName;
  if (ts.isIdentifier(typeName)) {
    return typeName.text;
  }
  return typeName.right.text;
}

function getAccessChain(expression) {
  const parts = [];
  let current = expression;

  while (isStaticAccessExpression(current)) {
    const name = getStaticAccessName(current);
    if (!name) return [];
    parts.unshift(name);
    current = current.expression;
  }

  if (ts.isThis(current)) {
    parts.unshift("this");
  } else if (ts.isIdentifier(current)) {
    parts.unshift(current.text);
  }

  return parts;
}

function isStaticAccessExpression(node) {
  return (
    ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)
  );
}

function getStaticAccessName(node) {
  if (ts.isPropertyAccessExpression(node)) {
    return node.name.text;
  }
  return getStaticName(node.argumentExpression);
}

function getStaticName(node) {
  if (
    ts.isIdentifier(node) ||
    ts.isStringLiteral(node) ||
    ts.isNoSubstitutionTemplateLiteral(node) ||
    ts.isNumericLiteral(node)
  ) {
    return node.text;
  }
  return "";
}

function unwrapExpression(expression) {
  let current = expression;
  while (
    ts.isAsExpression(current) ||
    ts.isSatisfiesExpression(current) ||
    ts.isParenthesizedExpression(current)
  ) {
    current = current.expression;
  }
  return current;
}

function dedupeNodes(nodes) {
  const seen = new Set();
  return nodes.filter(node => {
    const key = `${node.line}:${node.column}:${node.detected}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function isApiServiceProductionFile(filePath) {
  const normalized = filePath.split(path.sep).join("/");
  return (
    normalized.startsWith("packages/api/src/") &&
    normalized.endsWith(".ts") &&
    !normalized.endsWith(".spec.ts") &&
    !normalized.endsWith(".test.ts") &&
    (normalized.includes("/service/") || normalized.endsWith(".service.ts"))
  );
}

function lineRangesOverlapAny(node, ranges) {
  return ranges.some(
    range => node.startLine <= range.endLine && range.startLine <= node.endLine,
  );
}

function compareViolations(left, right) {
  return (
    left.filePath.localeCompare(right.filePath) ||
    left.line - right.line ||
    left.column - right.column
  );
}

function formatViolations(violations) {
  return [
    "Service DB access guard violations found.",
    "Service methods must call repository commands instead of Prisma clients.",
    "",
    ...violations.flatMap(violation => [
      `${violation.filePath}:${violation.line}:${violation.column}`,
      `  kind: ${violation.kind}`,
      `  detected: ${violation.detected}`,
      `  reason: ${violation.reason}`,
      "",
    ]),
  ].join("\n");
}

function resolveBaseRef(changedFrom, repoRoot) {
  try {
    return execFileSync("git", ["merge-base", changedFrom, "HEAD"], {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch (error) {
    throw new Error(
      `Could not resolve merge-base for ${changedFrom}. Run 'git fetch origin dev' and try again.`,
      { cause: error },
    );
  }
}

function readDiff({ baseRef, repoRoot, sourcePath }) {
  return execFileSync(
    "git",
    [
      "diff",
      "--unified=0",
      "--no-color",
      "--diff-filter=ACMR",
      baseRef,
      "--",
      sourcePath,
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
      maxBuffer: 20 * 1024 * 1024,
    },
  );
}

function parseArgs(argv) {
  const args = {
    changedFrom: DEFAULT_CHANGED_FROM,
    source: DEFAULT_SOURCE,
    help: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "-h" || arg === "--help") {
      args.help = true;
    } else if (arg === "--changed-from") {
      args.changedFrom = argv[index + 1] ?? "";
      index += 1;
    } else if (arg === "--source") {
      args.source = argv[index + 1] ?? "";
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return args;
}

function printHelp() {
  console.log(`Usage: node scripts/service-db-access-guard/changed-service-db-access-guard.mjs [options]

Options:
  --changed-from <ref>  Base ref for changed-line checks (default: origin/dev)
  --source <path>       Source path to scan (default: packages/api/src)
  -h, --help            Show this help message
`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
