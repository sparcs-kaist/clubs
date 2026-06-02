import path from "node:path";

import ts from "typescript";

const MANUAL_TRANSACTION_METHODS = new Set([
  "$transaction",
  "runInTransaction",
  "withTransaction",
]);

const PRISMA_WRITE_METHODS = new Set([
  "create",
  "createMany",
  "createManyAndReturn",
  "delete",
  "deleteMany",
  "update",
  "updateMany",
  "upsert",
]);

const RAW_COMMAND_METHODS = new Set(["$executeRaw", "$executeRawUnsafe"]);

export function findTransactionGuardNodes({
  sourceText,
  filePath,
  repositoryCommandIndex,
}) {
  const sourceFile = createSourceFile(sourceText, filePath);

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

  const classRepositoryProperties = new Map();

  const visit = node => {
    if (
      ts.isImportSpecifier(node) &&
      node.name.text === "PrismaTransactionClient"
    ) {
      record(
        node,
        "manual-transaction-type",
        node.name.text,
        "Prisma transaction client type import is a tx-parameter migration pattern",
      );
    }

    if (
      ts.isTypeReferenceNode(node) &&
      isManualTransactionType(node.typeName)
    ) {
      record(
        node,
        "manual-transaction-type",
        node.getText(sourceFile),
        "Prisma transaction client type usage is a tx-parameter migration pattern",
      );
    }

    if (
      ts.isParameter(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === "tx"
    ) {
      record(
        node.name,
        "tx-parameter",
        node.name.text,
        "passing tx as a parameter is not allowed in new feature code",
      );
    }

    if (
      ts.isMethodDeclaration(node) &&
      getPropertyNameText(node.name)?.endsWith("Tx")
    ) {
      record(
        node.name,
        "tx-suffix-method",
        getPropertyNameText(node.name),
        "Tx-suffixed methods preserve the legacy transaction-parameter style",
      );
    }

    if (ts.isCallExpression(node)) {
      const propertyAccess = getPropertyAccess(node.expression);

      if (
        propertyAccess &&
        MANUAL_TRANSACTION_METHODS.has(propertyAccess.name.text)
      ) {
        record(
          node.expression,
          "manual-transaction-call",
          node.expression.getText(sourceFile),
          "manual transactions should be replaced by @Transactional service boundaries",
        );
      }

      if (
        isRepositoryFile(filePath) &&
        isRootPrismaCommandCall(node.expression)
      ) {
        record(
          node.expression,
          "root-prisma-in-repository-command",
          node.expression.getText(sourceFile),
          "repository command methods must use TransactionHost.tx instead of root PrismaService",
        );
      }
    }

    if (ts.isClassDeclaration(node)) {
      classRepositoryProperties.set(node, getRepositoryProperties(node));
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);

  if (isServiceFile(filePath)) {
    sourceFile.forEachChild(node => {
      if (!ts.isClassDeclaration(node)) return;
      const repositoryProperties =
        classRepositoryProperties.get(node) ?? getRepositoryProperties(node);
      collectServiceTransactionViolations({
        sourceFile,
        classNode: node,
        repositoryProperties,
        repositoryCommandIndex,
        record,
      });
    });
  }

  return {
    nodes: sortNodes(dedupeNodes(nodes)),
    parseError: null,
  };
}

export function buildRepositoryCommandIndex(repositorySources) {
  const index = new Map();

  for (const { filePath, sourceText } of repositorySources) {
    const sourceFile = createSourceFile(sourceText, filePath);
    if (sourceFile.parseDiagnostics.length > 0) continue;

    sourceFile.forEachChild(node => {
      if (!ts.isClassDeclaration(node) || !node.name) return;

      const commandMethods = new Set();

      for (const member of node.members) {
        if (!ts.isMethodDeclaration(member)) continue;
        const methodName = getPropertyNameText(member.name);
        if (!methodName) continue;

        if (methodName.endsWith("Tx") || methodContainsCommandCall(member)) {
          commandMethods.add(methodName);
        }
      }

      index.set(node.name.text, commandMethods);
    });
  }

  return index;
}

function collectServiceTransactionViolations({
  sourceFile,
  classNode,
  repositoryProperties,
  repositoryCommandIndex,
  record,
}) {
  for (const member of classNode.members) {
    if (!ts.isMethodDeclaration(member) || hasTransactionalDecorator(member)) {
      continue;
    }

    const commandCalls = [];

    const visit = node => {
      if (ts.isCallExpression(node)) {
        const commandCall = getRepositoryCommandCall(
          node.expression,
          repositoryProperties,
          repositoryCommandIndex,
        );

        if (commandCall) {
          commandCalls.push({ node, ...commandCall });
        }
      }

      ts.forEachChild(node, visit);
    };

    visit(member);

    for (const commandCall of commandCalls) {
      record(
        member,
        "service-command-without-transactional",
        `${commandCall.repositoryProperty}.${commandCall.methodName}`,
        "service methods that call repository command methods must be decorated with @Transactional",
      );
    }
  }
}

function getRepositoryCommandCall(
  expression,
  repositoryProperties,
  repositoryCommandIndex,
) {
  if (!ts.isPropertyAccessExpression(expression)) return null;

  const methodName = expression.name.text;
  const repositoryAccess = expression.expression;
  if (!ts.isPropertyAccessExpression(repositoryAccess)) return null;
  if (
    repositoryAccess.expression.getText(repositoryAccess.getSourceFile()) !==
    "this"
  ) {
    return null;
  }

  const repositoryProperty = repositoryAccess.name.text;
  const repositoryClassName = repositoryProperties.get(repositoryProperty);
  if (!repositoryClassName) return null;

  const commandMethods = repositoryCommandIndex.get(repositoryClassName);
  if (!commandMethods?.has(methodName)) return null;

  return {
    methodName,
    repositoryProperty,
  };
}

function getRepositoryProperties(classNode) {
  const repositoryProperties = new Map();

  for (const member of classNode.members) {
    if (!ts.isConstructorDeclaration(member)) continue;

    for (const parameter of member.parameters) {
      if (!ts.isIdentifier(parameter.name)) continue;
      if (!hasAccessModifier(parameter)) continue;
      if (!parameter.type || !ts.isTypeReferenceNode(parameter.type)) continue;
      if (!ts.isIdentifier(parameter.type.typeName)) continue;

      const className = parameter.type.typeName.text;
      if (className.endsWith("Repository")) {
        repositoryProperties.set(parameter.name.text, className);
      }
    }
  }

  return repositoryProperties;
}

function methodContainsCommandCall(method) {
  let hasCommandCall = false;

  const visit = node => {
    if (hasCommandCall) return;

    if (ts.isCallExpression(node) && isPrismaCommandCall(node.expression)) {
      hasCommandCall = true;
      return;
    }

    ts.forEachChild(node, visit);
  };

  visit(method);

  return hasCommandCall;
}

function isRootPrismaCommandCall(expression) {
  if (!isPrismaCommandCall(expression)) return false;

  const chain = getPropertyAccessChain(expression);
  return chain[0] === "this" && chain[1] === "prisma";
}

function isPrismaCommandCall(expression) {
  const propertyAccess = getPropertyAccess(expression);
  if (!propertyAccess) return false;

  return (
    PRISMA_WRITE_METHODS.has(propertyAccess.name.text) ||
    RAW_COMMAND_METHODS.has(propertyAccess.name.text)
  );
}

function getPropertyAccess(expression) {
  return ts.isPropertyAccessExpression(expression) ? expression : null;
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

function hasTransactionalDecorator(method) {
  return getDecorators(method).some(decorator => {
    const expression = decorator.expression;

    if (ts.isIdentifier(expression)) {
      return expression.text === "Transactional";
    }

    if (ts.isCallExpression(expression)) {
      const callExpression = expression.expression;
      return (
        ts.isIdentifier(callExpression) &&
        callExpression.text === "Transactional"
      );
    }

    return false;
  });
}

function getDecorators(node) {
  return ts.canHaveDecorators(node) ? (ts.getDecorators(node) ?? []) : [];
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

function isManualTransactionType(typeName) {
  if (ts.isIdentifier(typeName)) {
    return typeName.text === "PrismaTransactionClient";
  }

  return (
    ts.isQualifiedName(typeName) &&
    ts.isIdentifier(typeName.left) &&
    typeName.left.text === "Prisma" &&
    typeName.right.text === "TransactionClient"
  );
}

function getPropertyNameText(name) {
  if (
    ts.isIdentifier(name) ||
    ts.isStringLiteral(name) ||
    ts.isNumericLiteral(name)
  ) {
    return name.text;
  }

  return undefined;
}

function makeNode(sourceFile, node, kind, detected, reason) {
  const start = node.getStart(sourceFile);
  const end = node.getEnd();
  const startPosition = sourceFile.getLineAndCharacterOfPosition(start);
  const endPosition = sourceFile.getLineAndCharacterOfPosition(
    Math.max(start, end - 1),
  );

  return {
    kind,
    detected,
    reason,
    startOffset: start,
    endOffset: end,
    line: startPosition.line + 1,
    column: startPosition.character + 1,
    startLine: startPosition.line + 1,
    endLine: endPosition.line + 1,
  };
}

function dedupeNodes(nodes) {
  const seen = new Set();

  return nodes.filter(node => {
    const key = `${node.kind}:${node.startOffset}:${node.endOffset}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function sortNodes(nodes) {
  return nodes.sort(
    (left, right) => left.line - right.line || left.column - right.column,
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

function isRepositoryFile(filePath) {
  return toPosixPath(filePath).includes("/repository/");
}

function isServiceFile(filePath) {
  return toPosixPath(filePath).includes("/service/");
}

function toPosixPath(filePath) {
  return filePath.split(path.sep).join(path.posix.sep);
}
