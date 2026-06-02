import path from "node:path";

import ts from "typescript";

const RAW_CLIENT_METHODS = new Set([
  "$executeRaw",
  "$executeRawUnsafe",
  "$queryRaw",
  "$queryRawUnsafe",
]);

const RAW_PRISMA_MEMBERS = new Set(["empty", "join", "raw", "sql"]);

export function findPrismaRawSqlNodes(sourceText, filePath) {
  const sourceFile = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    getScriptKind(filePath),
  );

  if (sourceFile.parseDiagnostics.length > 0) {
    return {
      nodes: [],
      parseError: formatParseDiagnostic(
        sourceFile,
        sourceFile.parseDiagnostics[0],
      ),
    };
  }

  const nodes = [];
  const seenRanges = new Set();

  const recordNode = (node, detected) => {
    const start = node.getStart(sourceFile);
    const end = node.getEnd();
    const key = `${start}:${end}:${detected}`;

    if (seenRanges.has(key)) {
      return;
    }

    seenRanges.add(key);

    const startPosition = sourceFile.getLineAndCharacterOfPosition(start);
    const endPosition = sourceFile.getLineAndCharacterOfPosition(
      Math.max(start, end - 1),
    );

    nodes.push({
      detected,
      startOffset: start,
      endOffset: end,
      line: startPosition.line + 1,
      column: startPosition.character + 1,
      startLine: startPosition.line + 1,
      endLine: endPosition.line + 1,
      text: normalizeText(node.getText(sourceFile)),
    });
  };

  const visit = node => {
    if (ts.isCallExpression(node)) {
      if (isRawClientMethodAccess(node.expression)) {
        recordNode(node, node.expression.getText(sourceFile));
      } else if (isPrismaRawMemberAccess(node.expression)) {
        recordNode(node, node.expression.getText(sourceFile));
      }
    } else if (ts.isTaggedTemplateExpression(node)) {
      if (isRawClientMethodAccess(node.tag)) {
        recordNode(node, node.tag.getText(sourceFile));
      } else if (isPrismaRawMemberAccess(node.tag)) {
        recordNode(node, node.tag.getText(sourceFile));
      }
    } else if (
      isPrismaRawMemberAccess(node) &&
      !isHandledPrismaRawMemberAccess(node)
    ) {
      recordNode(node, node.getText(sourceFile));
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);

  return {
    nodes: filterContainedNodes(nodes).sort(
      (left, right) => left.line - right.line || left.column - right.column,
    ),
    parseError: null,
  };
}

function filterContainedNodes(nodes) {
  return nodes.filter(
    (node, index) =>
      !nodes.some(
        (other, otherIndex) =>
          index !== otherIndex &&
          other.startOffset <= node.startOffset &&
          node.endOffset <= other.endOffset &&
          (other.startOffset < node.startOffset ||
            node.endOffset < other.endOffset),
      ),
  );
}

export function isLineInsideRawSqlNode(line, nodes) {
  return nodes.some(node => node.startLine <= line && line <= node.endLine);
}

function isRawClientMethodAccess(node) {
  return (
    ts.isPropertyAccessExpression(node) &&
    RAW_CLIENT_METHODS.has(node.name.text)
  );
}

function isPrismaRawMemberAccess(node) {
  return (
    ts.isPropertyAccessExpression(node) &&
    node.expression.getText(node.getSourceFile()) === "Prisma" &&
    RAW_PRISMA_MEMBERS.has(node.name.text)
  );
}

function isHandledPrismaRawMemberAccess(node) {
  const { parent } = node;

  return (
    (ts.isCallExpression(parent) && parent.expression === node) ||
    (ts.isTaggedTemplateExpression(parent) && parent.tag === node)
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
    case ".json":
      return ts.ScriptKind.JSON;
    default:
      return ts.ScriptKind.TS;
  }
}

function formatParseDiagnostic(sourceFile, diagnostic) {
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

function normalizeText(text) {
  return text.replace(/\s+/gu, " ").trim();
}
