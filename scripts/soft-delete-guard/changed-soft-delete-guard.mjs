#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import ts from "typescript";

const DEFAULT_CHANGED_FROM = "origin/dev";
const DEFAULT_SOURCE = "packages/api/src";
const DEFAULT_SCHEMA = "packages/api/prisma/schema.prisma";

const READ_OPERATIONS = new Set([
  "aggregate",
  "count",
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "groupBy",
]);
const UNIQUE_OPERATIONS = new Set(["findUnique", "findUniqueOrThrow"]);
const UPDATE_OPERATIONS = new Set(["update", "updateMany", "upsert"]);
const HARD_DELETE_OPERATIONS = new Set(["delete", "deleteMany"]);
const EXPLICIT_SOFT_DELETE_HELPERS = new Set([
  "activeOnly",
  "onlyDeleted",
  "withDeleted",
]);

function main() {
  const args = parseArgs(process.argv.slice(2));
  const repoRoot = process.cwd();
  const baseRef = resolveBaseRef(args.changedFrom, repoRoot);
  const diffText = readDiff({
    baseRef,
    repoRoot,
    sourcePaths: args.sources,
  });
  const changedFiles = parseChangedFileLineMap(diffText);
  const violations = findChangedSoftDeleteViolations({
    changedFiles,
    repoRoot,
    schemaPath: args.schema,
  });

  if (violations.length === 0) {
    console.log(
      `No soft-delete guard violations found relative to ${args.changedFrom}.`,
    );
    return;
  }

  console.error(formatViolations(violations));
  process.exitCode = 1;
}

export function findChangedSoftDeleteViolations({
  changedFiles,
  repoRoot = process.cwd(),
  schemaPath = DEFAULT_SCHEMA,
}) {
  const softDeleteDelegates = readSoftDeleteDelegates(repoRoot, schemaPath);
  const violations = [];

  for (const changedFile of changedFiles) {
    if (!isApiProductionTypeScriptFile(changedFile.path)) {
      continue;
    }

    const currentPath = path.resolve(repoRoot, changedFile.path);
    if (!fs.existsSync(currentPath)) {
      continue;
    }

    const sourceText = fs.readFileSync(currentPath, "utf8");
    const result = findSoftDeleteGuardNodes({
      sourceText,
      filePath: changedFile.path,
      softDeleteDelegates,
    });

    if (result.parseError) {
      violations.push({
        filePath: changedFile.path,
        line: result.parseError.line,
        column: result.parseError.column,
        kind: "parse-error",
        detected: "TypeScript parse error",
        reason: result.parseError.message,
      });
      continue;
    }

    for (const node of result.nodes) {
      if (!isNodeTouchedByChangedLines(node, changedFile)) {
        continue;
      }

      violations.push({
        filePath: changedFile.path,
        line: node.line,
        column: node.column,
        kind: node.kind,
        detected: node.detected,
        reason: node.reason,
      });
    }
  }

  return violations.sort(compareViolations);
}

export function parseChangedFileLineMap(diffText) {
  const files = new Map();
  let currentFile = null;
  let oldLine = 0;
  let newLine = 0;
  let insideHunk = false;

  for (const line of diffText.split("\n")) {
    if (line.startsWith("diff --git ")) {
      currentFile = null;
      insideHunk = false;
      continue;
    }

    if (line.startsWith("+++ ")) {
      currentFile = parseNewFilePath(line);
      insideHunk = false;

      if (currentFile && !files.has(currentFile)) {
        files.set(currentFile, {
          path: currentFile,
          addedRanges: [],
          deletedLines: [],
        });
      }
      continue;
    }

    const hunk = line.match(
      /^@@ -(?<oldStart>\d+)(?:,(?<oldCount>\d+))? \+(?<newStart>\d+)(?:,(?<newCount>\d+))? @@/u,
    );

    if (hunk) {
      oldLine = Number(hunk.groups.oldStart);
      newLine = Number(hunk.groups.newStart);
      insideHunk = true;
      continue;
    }

    if (!insideHunk || !currentFile) {
      continue;
    }

    const file = files.get(currentFile);

    if (line.startsWith("+")) {
      addLineRange(file.addedRanges, newLine, newLine);
      newLine += 1;
    } else if (line.startsWith("-")) {
      file.deletedLines.push({
        oldLine,
        adjacentLines: [newLine - 1, newLine, newLine + 1].filter(
          lineNumber => lineNumber > 0,
        ),
      });
      oldLine += 1;
    } else if (line.startsWith(" ")) {
      oldLine += 1;
      newLine += 1;
    }
  }

  return [...files.values()].filter(
    file => file.addedRanges.length > 0 || file.deletedLines.length > 0,
  );
}

function findSoftDeleteGuardNodes({
  sourceText,
  filePath,
  softDeleteDelegates,
}) {
  const sourceFile = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );

  if (sourceFile.parseDiagnostics.length > 0) {
    return {
      nodes: [],
      parseError: formatParseDiagnostic(sourceFile),
    };
  }

  const nodes = [];
  const record = (node, kind, detected, reason) => {
    nodes.push(makeNode(sourceFile, node, kind, detected, reason));
  };

  const visit = node => {
    if (ts.isCallExpression(node)) {
      const call = getSoftDeletePrismaCall(
        node.expression,
        softDeleteDelegates,
      );

      if (call) {
        const detected = node.expression.getText(sourceFile);

        if (HARD_DELETE_OPERATIONS.has(call.operation)) {
          record(
            node,
            "hard-delete-soft-delete-model",
            detected,
            "soft-delete models must be deleted by setting deletedAt instead of using Prisma hard delete APIs",
          );
        } else if (UNIQUE_OPERATIONS.has(call.operation)) {
          if (!hasExplicitSoftDeleteIntent(node.arguments[0])) {
            record(
              node,
              "ambiguous-find-unique",
              detected,
              "findUnique on a soft-delete model includes deleted rows unless the query explicitly uses withDeleted/deletedAt intent; use findFirst with activeOnly for active rows",
            );
          }
        } else if (
          READ_OPERATIONS.has(call.operation) ||
          UPDATE_OPERATIONS.has(call.operation)
        ) {
          if (!hasExplicitSoftDeleteIntent(node.arguments[0])) {
            record(
              node,
              "missing-soft-delete-intent",
              detected,
              "soft-delete model queries must explicitly choose activeOnly, onlyDeleted, withDeleted, or a deletedAt condition",
            );
          }
        }
      }
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);

  return {
    nodes: sortNodes(dedupeNodes(nodes)),
    parseError: null,
  };
}

function getSoftDeletePrismaCall(expression, softDeleteDelegates) {
  if (!ts.isPropertyAccessExpression(expression)) return null;

  const chain = getPropertyAccessChain(expression);
  const call = getPrismaModelOperation(chain);

  if (!call || !softDeleteDelegates.has(call.modelDelegate)) {
    return null;
  }

  return call;
}

function getPrismaModelOperation(chain) {
  if (chain.length >= 4 && chain[0] === "this" && chain[1] === "prisma") {
    return {
      modelDelegate: chain[2],
      operation: chain[3],
    };
  }

  if (
    chain.length >= 5 &&
    chain[0] === "this" &&
    chain[1] === "txHost" &&
    chain[2] === "tx"
  ) {
    return {
      modelDelegate: chain[3],
      operation: chain[4],
    };
  }

  if (chain.length >= 3 && ["prisma", "tx"].includes(chain[0])) {
    return {
      modelDelegate: chain[1],
      operation: chain[2],
    };
  }

  return null;
}

function hasExplicitSoftDeleteIntent(argument) {
  if (!argument || !ts.isObjectLiteralExpression(argument)) {
    return false;
  }

  const where = findPropertyAssignment(argument, "where");
  if (!where) {
    return false;
  }

  return expressionHasSoftDeleteIntent(where.initializer);
}

function expressionHasSoftDeleteIntent(expression) {
  if (ts.isParenthesizedExpression(expression)) {
    return expressionHasSoftDeleteIntent(expression.expression);
  }

  if (ts.isAsExpression(expression) || ts.isSatisfiesExpression(expression)) {
    return expressionHasSoftDeleteIntent(expression.expression);
  }

  if (ts.isCallExpression(expression)) {
    return isSoftDeleteHelperCall(expression);
  }

  if (!ts.isObjectLiteralExpression(expression)) {
    return false;
  }

  for (const property of expression.properties) {
    if (ts.isSpreadAssignment(property)) {
      if (expressionHasSoftDeleteIntent(property.expression)) {
        return true;
      }
      continue;
    }

    if (!ts.isPropertyAssignment(property)) {
      continue;
    }

    const propertyName = getPropertyNameText(property.name);
    if (
      propertyName === "deletedAt" &&
      !isUndefinedExpression(property.initializer)
    ) {
      return true;
    }

    if (
      ["AND", "OR", "NOT"].includes(propertyName) &&
      logicalExpressionHasSoftDeleteIntent(property.initializer)
    ) {
      return true;
    }
  }

  return false;
}

function logicalExpressionHasSoftDeleteIntent(expression) {
  if (ts.isArrayLiteralExpression(expression)) {
    return expression.elements.some(element =>
      expressionHasSoftDeleteIntent(element),
    );
  }

  return expressionHasSoftDeleteIntent(expression);
}

function isSoftDeleteHelperCall(expression) {
  const callee = expression.expression;

  if (ts.isIdentifier(callee)) {
    return EXPLICIT_SOFT_DELETE_HELPERS.has(callee.text);
  }

  return (
    ts.isPropertyAccessExpression(callee) &&
    EXPLICIT_SOFT_DELETE_HELPERS.has(callee.name.text)
  );
}

function findPropertyAssignment(objectLiteral, propertyName) {
  return objectLiteral.properties.find(
    property =>
      ts.isPropertyAssignment(property) &&
      getPropertyNameText(property.name) === propertyName,
  );
}

function isUndefinedExpression(expression) {
  return (
    (ts.isIdentifier(expression) && expression.text === "undefined") ||
    (ts.isVoidExpression(expression) &&
      ts.isNumericLiteral(expression.expression) &&
      expression.expression.text === "0")
  );
}

function readSoftDeleteDelegates(repoRoot, schemaPath) {
  const absoluteSchemaPath = path.resolve(repoRoot, schemaPath);

  if (!fs.existsSync(absoluteSchemaPath)) {
    throw new Error(`Prisma schema not found: ${schemaPath}`);
  }

  const schema = fs.readFileSync(absoluteSchemaPath, "utf8");
  const delegates = new Set();
  const modelRegex = /\bmodel\s+([A-Za-z][A-Za-z0-9_]*)\s*\{/gu;
  let match;

  while ((match = modelRegex.exec(schema)) !== null) {
    const modelName = match[1];
    const bodyStart = modelRegex.lastIndex;
    const bodyEnd = findMatchingBrace(schema, bodyStart - 1);

    if (bodyEnd === -1) {
      continue;
    }

    const body = schema.slice(bodyStart, bodyEnd);
    if (/^\s*deletedAt\s+/mu.test(body)) {
      delegates.add(toPrismaDelegateName(modelName));
    }
  }

  return delegates;
}

function findMatchingBrace(text, openingBraceIndex) {
  let depth = 0;

  for (let index = openingBraceIndex; index < text.length; index += 1) {
    const char = text[index];

    if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return index;
      }
    }
  }

  return -1;
}

function toPrismaDelegateName(modelName) {
  return `${modelName.charAt(0).toLowerCase()}${modelName.slice(1)}`;
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

function readDiff({ baseRef, repoRoot, sourcePaths }) {
  const args = [
    "diff",
    "--unified=0",
    "--no-color",
    "--diff-filter=ACMR",
    baseRef,
    "--",
    ...sourcePaths,
  ];

  return execFileSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
  });
}

function lineRangesOverlapAny(node, ranges) {
  return ranges.some(
    range => node.startLine <= range.endLine && range.startLine <= node.endLine,
  );
}

function isNodeTouchedByChangedLines(node, changedFile) {
  return (
    lineRangesOverlapAny(node, changedFile.addedRanges) ||
    changedFile.deletedLines.some(deletedLine =>
      isDeletionTouchingNode(deletedLine, node),
    )
  );
}

function isDeletionTouchingNode(deletedLine, node) {
  return deletedLine.adjacentLines.some(line => isLineInsideRange(line, node));
}

function isLineInsideRange(line, range) {
  return range.startLine <= line && line <= range.endLine;
}

function addLineRange(ranges, startLine, endLine) {
  const lastRange = ranges[ranges.length - 1];

  if (lastRange && lastRange.endLine + 1 === startLine) {
    lastRange.endLine = endLine;
    return;
  }

  ranges.push({ startLine, endLine });
}

function parseNewFilePath(line) {
  const filePath = line.slice(4).trim();

  if (filePath === "/dev/null") {
    return null;
  }

  return filePath.startsWith("b/") ? filePath.slice(2) : filePath;
}

function isApiProductionTypeScriptFile(filePath) {
  return (
    toPosixPath(filePath).startsWith("packages/api/src/") &&
    /\.ts$/u.test(filePath) &&
    !/\.(?:spec|test)\.ts$/u.test(filePath)
  );
}

function formatViolations(violations) {
  const lines = [
    "Soft-delete guard violations found.",
    "Queries against models with deletedAt must explicitly choose activeOnly, onlyDeleted, withDeleted, or a deletedAt condition.",
    "",
  ];

  for (const violation of violations.sort(compareViolations)) {
    lines.push(`${violation.filePath}:${violation.line}:${violation.column}`);
    lines.push(`  kind: ${violation.kind}`);
    lines.push(`  detected: ${violation.detected}`);
    lines.push(`  reason: ${violation.reason}`);
    lines.push("");
  }

  return lines.join("\n").trimEnd();
}

function compareViolations(left, right) {
  return (
    left.filePath.localeCompare(right.filePath) ||
    left.line - right.line ||
    left.column - right.column
  );
}

function makeNode(sourceFile, node, kind, detected, reason) {
  const start = sourceFile.getLineAndCharacterOfPosition(node.getStart());
  const end = sourceFile.getLineAndCharacterOfPosition(node.getEnd());

  return {
    kind,
    detected,
    reason,
    line: start.line + 1,
    column: start.character + 1,
    startLine: start.line + 1,
    endLine: end.line + 1,
  };
}

function sortNodes(nodes) {
  return nodes.sort(
    (left, right) =>
      left.startLine - right.startLine ||
      left.column - right.column ||
      left.kind.localeCompare(right.kind),
  );
}

function dedupeNodes(nodes) {
  const seen = new Set();
  const unique = [];

  for (const node of nodes) {
    const key = [
      node.kind,
      node.detected,
      node.line,
      node.column,
      node.reason,
    ].join("\0");

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    unique.push(node);
  }

  return unique;
}

function getPropertyAccessChain(node) {
  const chain = [];
  let current = node;

  while (ts.isPropertyAccessExpression(current)) {
    chain.unshift(current.name.text);
    current = current.expression;
  }

  chain.unshift(current.getText(current.getSourceFile()));
  return chain;
}

function getPropertyNameText(name) {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name)) {
    return name.text;
  }

  return null;
}

function formatParseDiagnostic(sourceFile) {
  const diagnostic = sourceFile.parseDiagnostics[0];
  const start = diagnostic.start ?? 0;
  const position = sourceFile.getLineAndCharacterOfPosition(start);

  return {
    line: position.line + 1,
    column: position.character + 1,
    message: ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"),
  };
}

function parseArgs(argv) {
  const args = {
    changedFrom: DEFAULT_CHANGED_FROM,
    schema: DEFAULT_SCHEMA,
    sources: [],
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--changed-from") {
      args.changedFrom = readValue(argv, index, arg);
      index += 1;
    } else if (arg === "--schema") {
      args.schema = readValue(argv, index, arg);
      index += 1;
    } else if (arg === "--source" || arg === "-s") {
      args.sources.push(readValue(argv, index, arg));
      index += 1;
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (args.sources.length === 0) {
    args.sources.push(DEFAULT_SOURCE);
  }

  return args;
}

function readValue(argv, index, arg) {
  const value = argv[index + 1];

  if (!value || value.startsWith("-")) {
    throw new Error(`${arg} requires a value.`);
  }

  return value;
}

function printHelp() {
  console.log(`Usage: pnpm soft-delete-guard:changed [options]

Options:
  --changed-from <ref>  Base ref for changed-line detection (default: origin/dev)
  --schema <path>      Prisma schema path (default: packages/api/prisma/schema.prisma)
  --source <path>      Source path to inspect (default: packages/api/src)
  -h, --help           Show this help message
`);
}

function toPosixPath(filePath) {
  return filePath.split(path.sep).join(path.posix.sep);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
