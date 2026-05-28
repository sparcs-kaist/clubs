"use strict";

const crypto = require("node:crypto");
const path = require("node:path");

const BOOLEAN_CONST_PREFIX =
  /^(?:is|has|can|should|needs|requires|allows)[A-Z_]/u;
const PREDICATE_METHODS = new Set(["some", "every", "filter", "find"]);
const PROVIDER_VERSION = 1;

exports.name = "mcdc-runtime-instrumenter";
exports.version = 1;
exports.factory = function factory({ configSet }) {
  const ts = configSet.compilerModule;

  return context => sourceFile => {
    if (!shouldInstrumentFile(sourceFile.fileName)) {
      return sourceFile;
    }

    const booleanDecisionConstNames = collectBooleanDecisionConstNames(
      ts,
      sourceFile,
    );
    const occurrenceCounts = new Map();

    const instrumentDecision = (expression, kind) => {
      const decision = collectDecision(ts, expression);

      if (decision === null || !decision.atoms.every(atom => atom.safe)) {
        return expression;
      }

      const metadata = createDecisionMetadata(
        ts,
        sourceFile,
        expression,
        kind,
        decision,
        occurrenceCounts,
      );

      return ts.factory.createCallExpression(
        ts.factory.createPropertyAccessExpression(
          ts.factory.createIdentifier("globalThis"),
          "__MCDC_EVALUATE__",
        ),
        undefined,
        [
          metadata,
          ts.factory.createArrayLiteralExpression(
            decision.atoms.map(atom =>
              ts.factory.createArrowFunction(
                undefined,
                undefined,
                [],
                undefined,
                ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
                atom.node,
              ),
            ),
            false,
          ),
          createCombineFunction(ts, decision.tree, decision.atoms.length),
        ],
      );
    };

    const visitor = node => {
      if (ts.isIfStatement(node)) {
        const expression = isBooleanDecisionConstReference(
          ts,
          node.expression,
          booleanDecisionConstNames,
        )
          ? node.expression
          : instrumentDecision(node.expression, "if");

        return ts.factory.updateIfStatement(
          node,
          expression,
          ts.visitNode(node.thenStatement, visitor),
          node.elseStatement
            ? ts.visitNode(node.elseStatement, visitor)
            : node.elseStatement,
        );
      }

      if (ts.isWhileStatement(node)) {
        const expression = isBooleanDecisionConstReference(
          ts,
          node.expression,
          booleanDecisionConstNames,
        )
          ? node.expression
          : instrumentDecision(node.expression, "while");

        return ts.factory.updateWhileStatement(
          node,
          expression,
          ts.visitNode(node.statement, visitor),
        );
      }

      if (ts.isDoStatement(node)) {
        const expression = isBooleanDecisionConstReference(
          ts,
          node.expression,
          booleanDecisionConstNames,
        )
          ? node.expression
          : instrumentDecision(node.expression, "do-while");

        return ts.factory.updateDoStatement(
          node,
          ts.visitNode(node.statement, visitor),
          expression,
        );
      }

      if (ts.isForStatement(node) && node.condition) {
        return ts.factory.updateForStatement(
          node,
          node.initializer,
          instrumentDecision(node.condition, "for"),
          node.incrementor,
          ts.visitNode(node.statement, visitor),
        );
      }

      if (ts.isConditionalExpression(node)) {
        const condition = isBooleanDecisionConstReference(
          ts,
          node.condition,
          booleanDecisionConstNames,
        )
          ? node.condition
          : instrumentDecision(node.condition, "conditional");

        return ts.factory.updateConditionalExpression(
          node,
          condition,
          node.questionToken,
          ts.visitNode(node.whenTrue, visitor),
          node.colonToken,
          ts.visitNode(node.whenFalse, visitor),
        );
      }

      if (
        isConstVariableDeclaration(ts, node) &&
        isBooleanConstName(ts, node.name)
      ) {
        const initializer = unwrapExpression(ts, node.initializer);

        if (
          !isSupportedArrayPredicateCall(ts, initializer) &&
          hasCompoundBooleanExpression(ts, initializer)
        ) {
          return ts.factory.updateVariableDeclaration(
            node,
            node.name,
            node.exclamationToken,
            node.type,
            instrumentDecision(initializer, "boolean-const"),
          );
        }
      }

      if (
        ts.isCallExpression(node) &&
        isSupportedArrayPredicateCall(ts, node)
      ) {
        return instrumentPredicateCall(ts, node, visitor, instrumentDecision);
      }

      if (ts.isCallExpression(node) && isTsPatternWhenCall(ts, node)) {
        return instrumentTsPatternWhenCall(
          ts,
          node,
          visitor,
          instrumentDecision,
        );
      }

      return ts.visitEachChild(node, visitor, context);
    };

    return ts.visitNode(sourceFile, visitor);
  };
};

function instrumentPredicateCall(ts, node, visitor, instrumentDecision) {
  const predicate = getPredicateDecisionExpression(ts, node);

  if (predicate === null) {
    return node;
  }

  const args = [...node.arguments];
  const callback = args[0];

  if (ts.isArrowFunction(callback)) {
    if (ts.isBlock(callback.body)) {
      const statements = callback.body.statements.map(statement => {
        if (ts.isReturnStatement(statement) && statement.expression) {
          return ts.factory.updateReturnStatement(
            statement,
            instrumentDecision(
              statement.expression,
              `${predicate.method}-predicate`,
            ),
          );
        }

        return ts.visitNode(statement, visitor);
      });

      args[0] = ts.factory.updateArrowFunction(
        callback,
        callback.modifiers,
        callback.typeParameters,
        callback.parameters,
        callback.type,
        callback.equalsGreaterThanToken,
        ts.factory.updateBlock(callback.body, statements),
      );
    } else {
      args[0] = ts.factory.updateArrowFunction(
        callback,
        callback.modifiers,
        callback.typeParameters,
        callback.parameters,
        callback.type,
        callback.equalsGreaterThanToken,
        instrumentDecision(callback.body, `${predicate.method}-predicate`),
      );
    }
  } else if (ts.isFunctionExpression(callback)) {
    const statements = callback.body.statements.map(statement => {
      if (ts.isReturnStatement(statement) && statement.expression) {
        return ts.factory.updateReturnStatement(
          statement,
          instrumentDecision(
            statement.expression,
            `${predicate.method}-predicate`,
          ),
        );
      }

      return ts.visitNode(statement, visitor);
    });

    args[0] = ts.factory.updateFunctionExpression(
      callback,
      callback.modifiers,
      callback.asteriskToken,
      callback.name,
      callback.typeParameters,
      callback.parameters,
      callback.type,
      ts.factory.updateBlock(callback.body, statements),
    );
  }

  return ts.factory.updateCallExpression(
    node,
    ts.visitNode(node.expression, visitor),
    node.typeArguments,
    args,
  );
}

function instrumentTsPatternWhenCall(ts, node, visitor, instrumentDecision) {
  const predicate = getTsPatternWhenDecisionExpression(ts, node);

  if (predicate === null) {
    return node;
  }

  const args = [...node.arguments];
  const callback = args[0];

  if (ts.isArrowFunction(callback)) {
    if (ts.isBlock(callback.body)) {
      const statements = callback.body.statements.map(statement => {
        if (ts.isReturnStatement(statement) && statement.expression) {
          return ts.factory.updateReturnStatement(
            statement,
            instrumentDecision(statement.expression, "ts-pattern-when"),
          );
        }

        return ts.visitNode(statement, visitor);
      });

      args[0] = ts.factory.updateArrowFunction(
        callback,
        callback.modifiers,
        callback.typeParameters,
        callback.parameters,
        callback.type,
        callback.equalsGreaterThanToken,
        ts.factory.updateBlock(callback.body, statements),
      );
    } else {
      args[0] = ts.factory.updateArrowFunction(
        callback,
        callback.modifiers,
        callback.typeParameters,
        callback.parameters,
        callback.type,
        callback.equalsGreaterThanToken,
        instrumentDecision(callback.body, "ts-pattern-when"),
      );
    }
  } else if (ts.isFunctionExpression(callback)) {
    const statements = callback.body.statements.map(statement => {
      if (ts.isReturnStatement(statement) && statement.expression) {
        return ts.factory.updateReturnStatement(
          statement,
          instrumentDecision(statement.expression, "ts-pattern-when"),
        );
      }

      return ts.visitNode(statement, visitor);
    });

    args[0] = ts.factory.updateFunctionExpression(
      callback,
      callback.modifiers,
      callback.asteriskToken,
      callback.name,
      callback.typeParameters,
      callback.parameters,
      callback.type,
      ts.factory.updateBlock(callback.body, statements),
    );
  }

  return ts.factory.updateCallExpression(
    node,
    ts.visitNode(node.expression, visitor),
    node.typeArguments,
    args,
  );
}

function shouldInstrumentFile(fileName) {
  const rawSources = process.env.MCDC_SOURCE_PATHS;

  if (!rawSources) {
    return false;
  }

  const normalizedFileName = normalizePath(path.resolve(fileName));
  const sourcePaths = JSON.parse(rawSources).map(sourcePath =>
    normalizePath(path.resolve(sourcePath)),
  );

  return sourcePaths.some(
    sourcePath =>
      normalizedFileName === sourcePath ||
      normalizedFileName.startsWith(`${sourcePath}/`),
  );
}

function createDecisionMetadata(
  ts,
  sourceFile,
  expression,
  kind,
  decision,
  occurrenceCounts,
) {
  const repoRoot = process.env.MCDC_REPO_ROOT ?? process.cwd();
  const sourcePath = normalizePath(
    path.relative(repoRoot, sourceFile.fileName),
  );
  const expressionText = normalizeExpressionText(
    expression.getText(sourceFile),
  );
  const position = sourceFile.getLineAndCharacterOfPosition(
    expression.getStart(sourceFile),
  );
  const line = position.line + 1;
  const column = position.character + 1;
  const expressionHash = createHash(expressionText);
  const conditions = decision.atoms.map((atom, index) => ({
    name: `C${index + 1}`,
    text: normalizeExpressionText(atom.node.getText(sourceFile)),
  }));
  const conditionsHash = createHash(
    conditions.map(condition => condition.text).join("\n"),
  );
  const providerId = getProviderId(kind);
  const stableBase = [
    sourcePath,
    providerId,
    kind,
    expressionHash,
    conditionsHash,
  ].join(":");
  const occurrenceIndex = (occurrenceCounts.get(stableBase) ?? 0) + 1;
  const stableKey = `${stableBase}:${occurrenceIndex}`;
  const id = createDecisionId(sourcePath, line, column, expressionHash);

  occurrenceCounts.set(stableBase, occurrenceIndex);

  return ts.factory.createObjectLiteralExpression(
    [
      property(ts, "id", ts.factory.createStringLiteral(id)),
      property(ts, "stableKey", ts.factory.createStringLiteral(stableKey)),
      property(ts, "providerId", ts.factory.createStringLiteral(providerId)),
      property(
        ts,
        "providerVersion",
        ts.factory.createNumericLiteral(PROVIDER_VERSION),
      ),
      property(ts, "sourcePath", ts.factory.createStringLiteral(sourcePath)),
      property(ts, "line", ts.factory.createNumericLiteral(line)),
      property(ts, "column", ts.factory.createNumericLiteral(column)),
      property(ts, "kind", ts.factory.createStringLiteral(kind)),
      property(
        ts,
        "occurrenceIndex",
        ts.factory.createNumericLiteral(occurrenceIndex),
      ),
      property(
        ts,
        "expression",
        ts.factory.createStringLiteral(expressionText),
      ),
      property(
        ts,
        "expressionHash",
        ts.factory.createStringLiteral(expressionHash),
      ),
      property(
        ts,
        "conditionsHash",
        ts.factory.createStringLiteral(conditionsHash),
      ),
      property(
        ts,
        "conditions",
        ts.factory.createArrayLiteralExpression(
          conditions.map(condition =>
            ts.factory.createObjectLiteralExpression(
              [
                property(
                  ts,
                  "name",
                  ts.factory.createStringLiteral(condition.name),
                ),
                property(
                  ts,
                  "text",
                  ts.factory.createStringLiteral(condition.text),
                ),
              ],
              false,
            ),
          ),
          false,
        ),
      ),
    ],
    false,
  );
}

function property(ts, name, value) {
  return ts.factory.createPropertyAssignment(name, value);
}

function createCombineFunction(ts, tree, atomCount) {
  const parameters = Array.from({ length: atomCount }, (_, index) =>
    ts.factory.createParameterDeclaration(
      undefined,
      undefined,
      ts.factory.createIdentifier(`C${index + 1}`),
    ),
  );

  return ts.factory.createArrowFunction(
    undefined,
    undefined,
    parameters,
    undefined,
    ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
    createCombineExpression(ts, tree),
  );
}

function createCombineExpression(ts, tree) {
  if (tree.kind === "atom") {
    return ts.factory.createIdentifier(`C${tree.index + 1}`);
  }

  if (tree.kind === "not") {
    return ts.factory.createPrefixUnaryExpression(
      ts.SyntaxKind.ExclamationToken,
      createCombineExpression(ts, tree.operand),
    );
  }

  return ts.factory.createBinaryExpression(
    createCombineExpression(ts, tree.left),
    tree.kind === "and"
      ? ts.factory.createToken(ts.SyntaxKind.AmpersandAmpersandToken)
      : ts.factory.createToken(ts.SyntaxKind.BarBarToken),
    createCombineExpression(ts, tree.right),
  );
}

function collectDecision(ts, expression) {
  const atoms = [];

  const visitExpression = node => {
    const expressionNode = unwrapExpression(ts, node);

    if (isLogicalBinaryExpression(ts, expressionNode)) {
      return {
        kind:
          expressionNode.operatorToken.kind ===
          ts.SyntaxKind.AmpersandAmpersandToken
            ? "and"
            : "or",
        left: visitExpression(expressionNode.left),
        right: visitExpression(expressionNode.right),
      };
    }

    if (isNegatedLogicalExpression(ts, expressionNode)) {
      return {
        kind: "not",
        operand: visitExpression(expressionNode.operand),
      };
    }

    const index = atoms.length;

    atoms.push({
      node: expressionNode,
      safe: isSafeAtomicCondition(ts, expressionNode),
    });

    return { kind: "atom", index };
  };

  const tree = visitExpression(expression);

  return atoms.length > 0 ? { atoms, tree } : null;
}

function isSafeAtomicCondition(ts, node) {
  const expression = unwrapExpression(ts, node);

  if (ts.isPrefixUnaryExpression(expression)) {
    return (
      expression.operator === ts.SyntaxKind.ExclamationToken &&
      isSafeAtomicCondition(ts, expression.operand)
    );
  }

  if (ts.isBinaryExpression(expression)) {
    return (
      !isLogicalBinaryExpression(ts, expression) &&
      isSafeValueExpression(ts, expression.left) &&
      isSafeValueExpression(ts, expression.right)
    );
  }

  return isSafeValueExpression(ts, expression);
}

function isSafeValueExpression(ts, node) {
  const expression = unwrapExpression(ts, node);

  return (
    ts.isIdentifier(expression) ||
    ts.isThis(expression) ||
    ts.isStringLiteral(expression) ||
    ts.isNumericLiteral(expression) ||
    expression.kind === ts.SyntaxKind.TrueKeyword ||
    expression.kind === ts.SyntaxKind.FalseKeyword ||
    expression.kind === ts.SyntaxKind.NullKeyword ||
    (ts.isPropertyAccessExpression(expression) &&
      isSafeValueExpression(ts, expression.expression)) ||
    (ts.isElementAccessExpression(expression) &&
      isSafeValueExpression(ts, expression.expression) &&
      isSafeValueExpression(ts, expression.argumentExpression)) ||
    (ts.isParenthesizedExpression(expression) &&
      isSafeValueExpression(ts, expression.expression))
  );
}

function collectBooleanDecisionConstNames(ts, sourceFile) {
  const names = new Set();

  const visit = node => {
    if (
      isConstVariableDeclaration(ts, node) &&
      isBooleanConstName(ts, node.name)
    ) {
      const initializer = unwrapExpression(ts, node.initializer);

      if (
        isSupportedArrayPredicateCall(ts, initializer) ||
        hasCompoundBooleanExpression(ts, initializer)
      ) {
        names.add(node.name.text);
      }
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);

  return names;
}

function isBooleanDecisionConstReference(
  ts,
  expression,
  booleanDecisionConstNames,
) {
  const unwrapped = unwrapExpression(ts, expression);

  return (
    ts.isIdentifier(unwrapped) && booleanDecisionConstNames.has(unwrapped.text)
  );
}

function isConstVariableDeclaration(ts, node) {
  return (
    ts.isVariableDeclaration(node) &&
    node.initializer !== undefined &&
    ts.isIdentifier(node.name) &&
    ts.isVariableDeclarationList(node.parent) &&
    (node.parent.flags & ts.NodeFlags.Const) !== 0
  );
}

function isBooleanConstName(ts, name) {
  return ts.isIdentifier(name) && BOOLEAN_CONST_PREFIX.test(name.text);
}

function hasCompoundBooleanExpression(ts, expression) {
  const unwrapped = unwrapExpression(ts, expression);

  return (
    isLogicalBinaryExpression(ts, unwrapped) ||
    isNegatedLogicalExpression(ts, unwrapped)
  );
}

function isSupportedArrayPredicateCall(ts, node) {
  return getPredicateDecisionExpression(ts, node) !== null;
}

function getPredicateDecisionExpression(ts, node) {
  if (
    !ts.isCallExpression(node) ||
    !ts.isPropertyAccessExpression(node.expression)
  ) {
    return null;
  }

  const method = node.expression.name.text;

  if (!PREDICATE_METHODS.has(method)) {
    return null;
  }

  const [callback] = node.arguments;

  if (!callback) {
    return null;
  }

  if (ts.isArrowFunction(callback)) {
    if (!ts.isBlock(callback.body)) {
      return { method, expression: callback.body };
    }

    const returnStatement = callback.body.statements.find(ts.isReturnStatement);

    if (returnStatement?.expression) {
      return { method, expression: returnStatement.expression };
    }
  }

  if (ts.isFunctionExpression(callback)) {
    const returnStatement = callback.body.statements.find(ts.isReturnStatement);

    if (returnStatement?.expression) {
      return { method, expression: returnStatement.expression };
    }
  }

  return null;
}

function isTsPatternWhenCall(ts, node) {
  if (
    !ts.isCallExpression(node) ||
    !ts.isPropertyAccessExpression(node.expression)
  ) {
    return false;
  }

  const receiver = unwrapExpression(ts, node.expression.expression);

  return (
    node.expression.name.text === "when" &&
    ts.isIdentifier(receiver) &&
    (receiver.text === "P" || receiver.text === "Pattern")
  );
}

function getTsPatternWhenDecisionExpression(ts, node) {
  const [callback] = node.arguments;

  if (!callback) {
    return null;
  }

  if (ts.isArrowFunction(callback)) {
    if (!ts.isBlock(callback.body)) {
      return { expression: callback.body };
    }

    const returnStatement = callback.body.statements.find(ts.isReturnStatement);

    if (returnStatement?.expression) {
      return { expression: returnStatement.expression };
    }
  }

  if (ts.isFunctionExpression(callback)) {
    const returnStatement = callback.body.statements.find(ts.isReturnStatement);

    if (returnStatement?.expression) {
      return { expression: returnStatement.expression };
    }
  }

  return null;
}

function unwrapExpression(ts, node) {
  let current = node;

  while (
    ts.isParenthesizedExpression(current) ||
    ts.isAsExpression(current) ||
    ts.isTypeAssertionExpression(current) ||
    ts.isNonNullExpression(current) ||
    ts.isSatisfiesExpression?.(current)
  ) {
    current = current.expression;
  }

  return current;
}

function isLogicalBinaryExpression(ts, node) {
  return (
    ts.isBinaryExpression(node) &&
    (node.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken ||
      node.operatorToken.kind === ts.SyntaxKind.BarBarToken)
  );
}

function isNegatedLogicalExpression(ts, node) {
  return (
    ts.isPrefixUnaryExpression(node) &&
    node.operator === ts.SyntaxKind.ExclamationToken &&
    isLogicalBinaryExpression(ts, unwrapExpression(ts, node.operand))
  );
}

function getProviderId(kind) {
  if (kind === "boolean-const") {
    return "typescript-boolean-const";
  }

  if (kind === "ts-pattern-when") {
    return "typescript-ts-pattern";
  }

  if (kind.endsWith("-predicate")) {
    return "typescript-array-predicate";
  }

  return "typescript-control-flow";
}

function createDecisionId(sourcePath, line, column, expressionHash) {
  return `${sourcePath}:${line}:${column}:${expressionHash}`;
}

function createHash(text) {
  return crypto.createHash("sha1").update(text).digest("hex").slice(0, 8);
}

function normalizeExpressionText(text) {
  return text.replace(/\s+/g, " ").trim();
}

function normalizePath(filePath) {
  return filePath.split(path.sep).join(path.posix.sep);
}
