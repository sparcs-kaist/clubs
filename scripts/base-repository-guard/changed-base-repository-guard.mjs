#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import ts from "typescript";

const DEFAULT_CHANGED_FROM = "origin/dev";
const DEFAULT_SOURCE = "packages/api/src";

const BASE_REPOSITORY_CLASS_NAMES = new Set([
  "BaseRepository",
  "BaseSingleTableRepository",
  "BaseMultiTableRepository",
]);

const BASE_REPOSITORY_WRITE_METHODS = new Set([
  "create",
  "put",
  "patch",
  "delete",
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
  const violations = findChangedBaseRepositoryViolations({
    changedFiles,
    repoRoot,
  });

  if (violations.length === 0) {
    console.log(
      `No BaseRepository guard violations found relative to ${args.changedFrom}.`,
    );
    return;
  }

  console.error(formatViolations(violations));
  process.exitCode = 1;
}

export function findChangedBaseRepositoryViolations({
  changedFiles,
  repoRoot = process.cwd(),
}) {
  const baseRepositoryIndex = buildBaseRepositoryIndex(
    readApiSources(repoRoot),
  );
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
    const result = findBaseRepositoryGuardNodes({
      sourceText,
      filePath: changedFile.path,
      baseRepositoryIndex,
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

function findBaseRepositoryGuardNodes({
  sourceText,
  filePath,
  baseRepositoryIndex,
}) {
  const sourceFile = createSourceFile(sourceText, filePath);

  if (sourceFile.parseDiagnostics.length > 0) {
    return {
      nodes: [],
      parseError: formatParseDiagnostic(sourceFile),
    };
  }

  const nodes = [];
  const record = (node, rangeNode, kind, detected, reason) => {
    nodes.push(makeNode(sourceFile, node, rangeNode, kind, detected, reason));
  };

  sourceFile.forEachChild(node => {
    if (!ts.isClassDeclaration(node) || !node.name) {
      return;
    }

    if (isServiceFile(filePath)) {
      collectServiceBaseRepositoryViolations({
        sourceFile,
        classNode: node,
        baseRepositoryIndex,
        record,
      });
    }

    const classInfo = baseRepositoryIndex.get(node.name.text);
    if (
      classInfo?.isBaseRepositoryDescendant &&
      !isBaseRepositoryImplementationFile(filePath)
    ) {
      collectRepositoryBaseRepositoryViolations({
        sourceFile,
        classNode: node,
        record,
      });
    }
  });

  return {
    nodes: sortNodes(dedupeNodes(nodes)),
    parseError: null,
  };
}

function buildBaseRepositoryIndex(apiSources) {
  const index = new Map();

  for (const { filePath, sourceText } of apiSources) {
    const sourceFile = createSourceFile(sourceText, filePath);
    if (sourceFile.parseDiagnostics.length > 0) continue;

    const visit = node => {
      if (ts.isClassDeclaration(node) && node.name) {
        index.set(node.name.text, {
          className: node.name.text,
          filePath,
          extendsName: getExtendsClassName(node),
          ownMethods: getOwnMethodNames(node),
          baseWriteWrapperMethods: getBaseWriteWrapperMethodNames(node),
          isBaseRepositoryDescendant: false,
        });
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
  }

  let changed = true;
  while (changed) {
    changed = false;

    for (const classInfo of index.values()) {
      if (classInfo.isBaseRepositoryDescendant) {
        continue;
      }

      const parentInfo = classInfo.extendsName
        ? index.get(classInfo.extendsName)
        : null;

      if (
        classInfo.extendsName &&
        (BASE_REPOSITORY_CLASS_NAMES.has(classInfo.extendsName) ||
          parentInfo?.isBaseRepositoryDescendant)
      ) {
        classInfo.isBaseRepositoryDescendant = true;
        changed = true;
      }

      if (parentInfo?.baseWriteWrapperMethods) {
        for (const methodName of parentInfo.baseWriteWrapperMethods) {
          if (
            classInfo.baseWriteWrapperMethods.has(methodName) ||
            classInfo.ownMethods.has(methodName)
          ) {
            continue;
          }

          classInfo.baseWriteWrapperMethods.add(methodName);
          changed = true;
        }
      }
    }
  }

  return index;
}

function collectServiceBaseRepositoryViolations({
  sourceFile,
  classNode,
  baseRepositoryIndex,
  record,
}) {
  const repositoryProperties = getRepositoryProperties(classNode);

  for (const member of classNode.members) {
    if (!ts.isMethodDeclaration(member)) {
      continue;
    }

    const repositoryAliases = new Map();

    const visit = node => {
      addRepositoryAliases(node, repositoryProperties, repositoryAliases);

      const extraction = getBaseRepositoryWriteExtraction({
        node,
        sourceFile,
        repositoryProperties,
        repositoryAliases,
        baseRepositoryIndex,
      });

      if (extraction) {
        record(
          extraction.node,
          member,
          "service-base-repository-write",
          extraction.detected,
          `service methods must not extract inherited BaseRepository.${extraction.methodName}; move the command into an explicit Prisma repository method`,
        );
      }

      if (ts.isCallExpression(node)) {
        const call = getInheritedBaseRepositoryWriteCall({
          expression: node.expression,
          repositoryProperties,
          repositoryAliases,
          baseRepositoryIndex,
        });

        if (call) {
          record(
            node.expression,
            member,
            "service-base-repository-write",
            node.expression.getText(sourceFile),
            `service methods must not call inherited BaseRepository.${call.methodName}; move the command into an explicit Prisma repository method`,
          );
        }
      }

      ts.forEachChild(node, visit);
    };

    visit(member);
  }
}

function collectRepositoryBaseRepositoryViolations({
  sourceFile,
  classNode,
  record,
}) {
  for (const member of classNode.members) {
    if (!ts.isMethodDeclaration(member)) {
      continue;
    }

    const visit = node => {
      if (ts.isCallExpression(node)) {
        const expression = getBaseRepositoryWriteCallExpression(
          node.expression,
        );

        if (expression) {
          record(
            expression,
            member,
            "repository-base-repository-write",
            expression.getText(sourceFile),
            "repository methods must use explicit Prisma commands through TransactionHost.tx instead of calling BaseRepository write APIs",
          );
        }
      }

      ts.forEachChild(node, visit);
    };

    visit(member);
  }
}

function getInheritedBaseRepositoryWriteCall({
  expression,
  repositoryProperties,
  repositoryAliases,
  baseRepositoryIndex,
}) {
  const methodName = getMemberAccessName(expression);
  const repositoryAccess = getMemberAccessTarget(expression);
  if (!methodName || !repositoryAccess) {
    return null;
  }
  const repositoryProperty = getRepositoryPropertyName(
    repositoryAccess,
    repositoryAliases,
  );
  if (!repositoryProperty) {
    return null;
  }

  const repositoryClassName = repositoryProperties.get(repositoryProperty);
  if (!repositoryClassName) {
    return null;
  }

  const repositoryInfo = baseRepositoryIndex.get(repositoryClassName);
  if (!repositoryInfo?.isBaseRepositoryDescendant) {
    return null;
  }

  if (!isForbiddenBaseRepositoryMethod(repositoryInfo, methodName)) {
    return null;
  }

  return {
    methodName,
    repositoryClassName,
    repositoryProperty,
  };
}

function getBaseRepositoryWriteCallExpression(expression) {
  const methodName = getMemberAccessName(expression);
  const receiver = getMemberAccessTarget(expression);
  if (!methodName || !receiver) {
    return null;
  }

  if (!BASE_REPOSITORY_WRITE_METHODS.has(methodName)) {
    return null;
  }

  if (isThisExpression(receiver) || isSuperExpression(receiver)) {
    return expression;
  }

  return null;
}

function getBaseRepositoryWriteExtraction({
  node,
  sourceFile,
  repositoryProperties,
  repositoryAliases,
  baseRepositoryIndex,
}) {
  if (!ts.isVariableDeclaration(node)) {
    return null;
  }

  if (ts.isIdentifier(node.name) && node.initializer) {
    const call = getInheritedBaseRepositoryWriteCall({
      expression: node.initializer,
      repositoryProperties,
      repositoryAliases,
      baseRepositoryIndex,
    });

    if (!call) {
      return null;
    }

    return {
      ...call,
      node: node.initializer,
      detected: node.initializer.getText(sourceFile),
    };
  }

  if (!ts.isObjectBindingPattern(node.name) || !node.initializer) {
    return null;
  }

  const repositoryProperty = getRepositoryPropertyName(
    node.initializer,
    repositoryAliases,
  );
  if (!repositoryProperty) {
    return null;
  }

  const repositoryClassName = repositoryProperties.get(repositoryProperty);
  if (!repositoryClassName) {
    return null;
  }

  const repositoryInfo = baseRepositoryIndex.get(repositoryClassName);
  if (!repositoryInfo?.isBaseRepositoryDescendant) {
    return null;
  }

  for (const element of node.name.elements) {
    const methodName = getPropertyNameText(element.propertyName);
    const bindingName =
      methodName ?? (ts.isIdentifier(element.name) ? element.name.text : null);

    if (!bindingName) {
      continue;
    }

    if (!isForbiddenBaseRepositoryMethod(repositoryInfo, bindingName)) {
      continue;
    }

    return {
      methodName: bindingName,
      repositoryClassName,
      repositoryProperty,
      node: element,
      detected: `${node.initializer.getText(sourceFile)}.${bindingName}`,
    };
  }

  return null;
}

function isForbiddenBaseRepositoryMethod(repositoryInfo, methodName) {
  if (repositoryInfo.baseWriteWrapperMethods.has(methodName)) {
    return true;
  }

  if (!BASE_REPOSITORY_WRITE_METHODS.has(methodName)) {
    return false;
  }

  return !repositoryInfo.ownMethods.has(methodName);
}

function addRepositoryAliases(node, repositoryProperties, repositoryAliases) {
  if (!ts.isVariableDeclaration(node)) {
    return;
  }

  if (!node.parent || !ts.isVariableDeclarationList(node.parent)) {
    return;
  }

  if (!(node.parent.flags & ts.NodeFlags.Const)) {
    return;
  }

  if (ts.isIdentifier(node.name)) {
    const repositoryProperty = getThisRepositoryPropertyName(node.initializer);
    if (repositoryProperty && repositoryProperties.has(repositoryProperty)) {
      repositoryAliases.set(node.name.text, repositoryProperty);
    }
    return;
  }

  if (
    ts.isObjectBindingPattern(node.name) &&
    node.initializer &&
    isThisExpression(node.initializer)
  ) {
    for (const element of node.name.elements) {
      if (!ts.isIdentifier(element.name)) {
        continue;
      }

      const propertyName =
        getPropertyNameText(element.propertyName) ?? element.name.text;
      if (repositoryProperties.has(propertyName)) {
        repositoryAliases.set(element.name.text, propertyName);
      }
    }
  }
}

function getRepositoryPropertyName(expression, repositoryAliases) {
  const directProperty = getThisRepositoryPropertyName(expression);
  if (directProperty) {
    return directProperty;
  }

  if (ts.isIdentifier(expression)) {
    return repositoryAliases.get(expression.text) ?? null;
  }

  return null;
}

function getThisRepositoryPropertyName(expression) {
  if (!expression || !ts.isPropertyAccessExpression(expression)) {
    return null;
  }

  if (!isThisExpression(expression.expression)) {
    return null;
  }

  return expression.name.text;
}

function getMemberAccessName(expression) {
  if (ts.isPropertyAccessExpression(expression)) {
    return expression.name.text;
  }

  if (ts.isElementAccessExpression(expression)) {
    return getStringLiteralText(expression.argumentExpression);
  }

  return null;
}

function getMemberAccessTarget(expression) {
  if (
    ts.isPropertyAccessExpression(expression) ||
    ts.isElementAccessExpression(expression)
  ) {
    return expression.expression;
  }

  return null;
}

function getStringLiteralText(expression) {
  if (ts.isStringLiteral(expression)) {
    return expression.text;
  }

  return null;
}

function getRepositoryProperties(classNode) {
  const repositoryProperties = new Map();

  for (const member of classNode.members) {
    if (ts.isConstructorDeclaration(member)) {
      for (const parameter of member.parameters) {
        if (!ts.isIdentifier(parameter.name)) continue;
        if (!hasAccessModifier(parameter)) continue;

        const className = getTypeReferenceIdentifierText(parameter.type);
        if (className?.endsWith("Repository")) {
          repositoryProperties.set(parameter.name.text, className);
        }
      }
    }

    if (ts.isPropertyDeclaration(member) && ts.isIdentifier(member.name)) {
      const className = getTypeReferenceIdentifierText(member.type);
      if (className?.endsWith("Repository")) {
        repositoryProperties.set(member.name.text, className);
      }
    }
  }

  return repositoryProperties;
}

function getTypeReferenceIdentifierText(typeNode) {
  if (!typeNode || !ts.isTypeReferenceNode(typeNode)) {
    return null;
  }

  if (ts.isIdentifier(typeNode.typeName)) {
    return typeNode.typeName.text;
  }

  return null;
}

function isThisExpression(node) {
  return node.kind === ts.SyntaxKind.ThisKeyword;
}

function isSuperExpression(node) {
  return node.kind === ts.SyntaxKind.SuperKeyword;
}

function getOwnMethodNames(classNode) {
  const methodNames = new Set();

  for (const member of classNode.members) {
    if (ts.isMethodDeclaration(member)) {
      const methodName = getPropertyNameText(member.name);
      if (methodName) {
        methodNames.add(methodName);
      }
      continue;
    }

    if (ts.isPropertyDeclaration(member)) {
      const propertyName = getPropertyNameText(member.name);
      if (
        propertyName &&
        member.initializer &&
        (ts.isArrowFunction(member.initializer) ||
          ts.isFunctionExpression(member.initializer))
      ) {
        methodNames.add(propertyName);
      }
    }
  }

  return methodNames;
}

function getBaseWriteWrapperMethodNames(classNode) {
  const methodNames = new Set();

  for (const member of classNode.members) {
    if (!ts.isMethodDeclaration(member)) {
      continue;
    }

    const methodName = getPropertyNameText(member.name);
    if (methodName && methodContainsBaseRepositoryWriteCall(member)) {
      methodNames.add(methodName);
    }
  }

  return methodNames;
}

function methodContainsBaseRepositoryWriteCall(method) {
  let hasBaseRepositoryWriteCall = false;

  const visit = node => {
    if (hasBaseRepositoryWriteCall) {
      return;
    }

    if (
      ts.isCallExpression(node) &&
      getBaseRepositoryWriteCallExpression(node.expression)
    ) {
      hasBaseRepositoryWriteCall = true;
      return;
    }

    ts.forEachChild(node, visit);
  };

  visit(method);

  return hasBaseRepositoryWriteCall;
}

function getExtendsClassName(classNode) {
  const heritageClause = classNode.heritageClauses?.find(
    clause => clause.token === ts.SyntaxKind.ExtendsKeyword,
  );
  const heritageType = heritageClause?.types[0];
  if (!heritageType) {
    return null;
  }

  const expression = heritageType.expression;
  if (ts.isIdentifier(expression)) {
    return expression.text;
  }

  if (ts.isPropertyAccessExpression(expression)) {
    return expression.name.text;
  }

  return null;
}

function readApiSources(repoRoot) {
  const sourceRoot = path.resolve(repoRoot, DEFAULT_SOURCE);
  if (!fs.existsSync(sourceRoot)) {
    return [];
  }

  return walkFiles(sourceRoot)
    .map(filePath => path.relative(repoRoot, filePath))
    .filter(filePath => isApiProductionTypeScriptFile(filePath))
    .map(filePath => ({
      filePath,
      sourceText: fs.readFileSync(path.resolve(repoRoot, filePath), "utf8"),
    }));
}

function walkFiles(directory) {
  const files = [];

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(fullPath));
    } else {
      files.push(fullPath);
    }
  }

  return files;
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
  const filePath = line.slice("+++ ".length).trim();

  if (filePath === "/dev/null") {
    return null;
  }

  return filePath.startsWith("b/") ? filePath.slice(2) : filePath;
}

function hasAccessModifier(parameter) {
  return parameter.modifiers?.some(modifier =>
    [
      ts.SyntaxKind.PrivateKeyword,
      ts.SyntaxKind.ProtectedKeyword,
      ts.SyntaxKind.PublicKeyword,
    ].includes(modifier.kind),
  );
}

function getPropertyNameText(name) {
  if (!name) {
    return null;
  }

  if (
    ts.isIdentifier(name) ||
    ts.isStringLiteral(name) ||
    ts.isNumericLiteral(name)
  ) {
    return name.text;
  }

  return null;
}

function makeNode(sourceFile, node, rangeNode, kind, detected, reason) {
  const start = node.getStart(sourceFile);
  const rangeStart = rangeNode.getStart(sourceFile);
  const rangeEnd = rangeNode.getEnd();
  const startPosition = sourceFile.getLineAndCharacterOfPosition(start);
  const rangeStartPosition =
    sourceFile.getLineAndCharacterOfPosition(rangeStart);
  const rangeEndPosition = sourceFile.getLineAndCharacterOfPosition(
    Math.max(rangeStart, rangeEnd - 1),
  );

  return {
    kind,
    detected,
    reason,
    line: startPosition.line + 1,
    column: startPosition.character + 1,
    startLine: rangeStartPosition.line + 1,
    endLine: rangeEndPosition.line + 1,
  };
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

function sortNodes(nodes) {
  return nodes.sort(
    (left, right) =>
      left.startLine - right.startLine ||
      left.line - right.line ||
      left.column - right.column ||
      left.kind.localeCompare(right.kind),
  );
}

function createSourceFile(sourceText, filePath) {
  return ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    getScriptKind(filePath),
  );
}

function getScriptKind(filePath) {
  switch (path.extname(filePath)) {
    case ".tsx":
      return ts.ScriptKind.TSX;
    case ".jsx":
      return ts.ScriptKind.JSX;
    case ".js":
    case ".mjs":
    case ".cjs":
      return ts.ScriptKind.JS;
    default:
      return ts.ScriptKind.TS;
  }
}

function formatParseDiagnostic(sourceFile) {
  const [diagnostic] = sourceFile.parseDiagnostics;
  const position = sourceFile.getLineAndCharacterOfPosition(
    diagnostic.start ?? 0,
  );
  const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");

  return {
    line: position.line + 1,
    column: position.character + 1,
    message,
  };
}

function isApiProductionTypeScriptFile(filePath) {
  return (
    toPosixPath(filePath).startsWith("packages/api/src/") &&
    /\.ts$/u.test(filePath) &&
    !/\.(?:spec|test)\.ts$/u.test(filePath)
  );
}

function isServiceFile(filePath) {
  const posixPath = toPosixPath(filePath);
  return (
    posixPath.includes("/service/") ||
    posixPath.includes("/publicService/") ||
    /\.service\.ts$/u.test(posixPath)
  );
}

function isBaseRepositoryImplementationFile(filePath) {
  return toPosixPath(filePath).startsWith("packages/api/src/common/base/");
}

function formatViolations(violations) {
  const lines = [
    "BaseRepository guard violations found.",
    "Changed service/repository methods must not newly rely on inherited BaseRepository write APIs.",
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

function parseArgs(argv) {
  const args = {
    changedFrom: DEFAULT_CHANGED_FROM,
    sources: [],
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--changed-from") {
      args.changedFrom = readValue(argv, index, arg);
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
  console.log(`Usage: pnpm base-repository-guard:changed [options]

Options:
  --changed-from <ref>  Base ref for changed-method detection (default: origin/dev)
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
