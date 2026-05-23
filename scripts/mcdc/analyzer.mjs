import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import ts from "typescript";

export const SOURCE_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".mts",
  ".cts",
]);

const EVIDENCE_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".json",
]);

const IGNORED_DIRECTORIES = new Set([
  ".git",
  ".next",
  ".turbo",
  "coverage",
  "dist",
  "node_modules",
  "storybook-static",
]);

const BOOLEAN_CONST_PREFIX =
  /^(?:is|has|can|should|needs|requires|allows)[A-Z_]/u;
const PREDICATE_METHODS = new Set(["some", "every", "filter", "find"]);
const PROVIDER_VERSION = 1;

export function analyzeSourcePaths(sourcePaths, options = {}) {
  const rootDir = options.rootDir ?? process.cwd();
  const minConditions = options.minConditions ?? 1;
  const files = collectFiles(sourcePaths, SOURCE_EXTENSIONS);

  return files.flatMap(filePath =>
    analyzeSourceFile(filePath, { rootDir, minConditions }),
  );
}

export function analyzeSourceFile(filePath, options = {}) {
  const rootDir = options.rootDir ?? process.cwd();
  const minConditions = options.minConditions ?? 1;
  const sourceText = fs.readFileSync(filePath, "utf8");
  return analyzeSourceText(sourceText, filePath, { rootDir, minConditions });
}

export function analyzeSourceText(sourceText, filePath, options = {}) {
  const rootDir = options.rootDir ?? process.cwd();
  const minConditions = options.minConditions ?? 1;
  const sourceFile = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    getScriptKind(filePath),
  );
  const decisions = [];
  const booleanDecisionConstNames =
    collectBooleanDecisionConstNames(sourceFile);

  const recordDecision = (expression, kind) => {
    const conditions = collectAtomicConditions(expression, sourceFile);

    if (conditions.length < minConditions) {
      return;
    }

    const expressionText = normalizeExpressionText(
      expression.getText(sourceFile),
    );
    const position = sourceFile.getLineAndCharacterOfPosition(
      expression.getStart(sourceFile),
    );
    const sourcePath = toPosixPath(path.relative(rootDir, filePath));
    const line = position.line + 1;
    const column = position.character + 1;
    const expressionHash = createHash(expressionText);
    const conditionsHash = createHash(
      conditions.map(condition => condition.text).join("\n"),
    );
    const providerId = getProviderId(kind);

    decisions.push({
      id: createDecisionId(sourcePath, line, column, expressionHash),
      providerId,
      providerVersion: PROVIDER_VERSION,
      sourcePath,
      line,
      column,
      kind,
      expression: expressionText,
      expressionHash,
      conditionsHash,
      conditions,
    });
  };

  const visit = node => {
    if (ts.isIfStatement(node)) {
      if (
        !isBooleanDecisionConstReference(
          node.expression,
          booleanDecisionConstNames,
        )
      ) {
        recordDecision(node.expression, "if");
      }
    } else if (ts.isWhileStatement(node)) {
      if (
        !isBooleanDecisionConstReference(
          node.expression,
          booleanDecisionConstNames,
        )
      ) {
        recordDecision(node.expression, "while");
      }
    } else if (ts.isDoStatement(node)) {
      if (
        !isBooleanDecisionConstReference(
          node.expression,
          booleanDecisionConstNames,
        )
      ) {
        recordDecision(node.expression, "do-while");
      }
    } else if (ts.isForStatement(node) && node.condition) {
      recordDecision(node.condition, "for");
    } else if (ts.isConditionalExpression(node)) {
      if (
        !isBooleanDecisionConstReference(
          node.condition,
          booleanDecisionConstNames,
        )
      ) {
        recordDecision(node.condition, "conditional");
      }
    } else if (
      isConstVariableDeclaration(node) &&
      isBooleanConstName(node.name)
    ) {
      const initializer = unwrapExpression(node.initializer);

      if (
        !isSupportedArrayPredicateCall(initializer) &&
        hasCompoundBooleanExpression(initializer)
      ) {
        recordDecision(initializer, "boolean-const");
      }
    } else if (
      ts.isCallExpression(node) &&
      isSupportedArrayPredicateCall(node)
    ) {
      const predicate = getPredicateDecisionExpression(node);

      if (predicate !== null) {
        recordDecision(predicate.expression, `${predicate.method}-predicate`);
      }
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);

  return withStableKeys(decisions);
}

export function isSourceFilePath(filePath) {
  return SOURCE_EXTENSIONS.has(path.extname(filePath));
}

export function collectEvidence(evidencePaths, options = {}) {
  const rootDir = options.rootDir ?? process.cwd();
  const evidenceByDecision = new Map();
  const files = collectFiles(evidencePaths, EVIDENCE_EXTENSIONS);

  for (const filePath of files) {
    const relativePath = toPosixPath(path.relative(rootDir, filePath));
    const text = fs.readFileSync(filePath, "utf8");
    const casesByDecision = filePath.endsWith(".json")
      ? parseJsonEvidence(text, relativePath)
      : parseCommentEvidence(text, relativePath);

    mergeEvidence(evidenceByDecision, casesByDecision);
  }

  return evidenceByDecision;
}

export function buildReport(decisions, evidenceByDecision) {
  const results = decisions.map(decision => {
    const evidence = resolveDecisionEvidence(decision, evidenceByDecision);
    const coverage = evaluateDecisionCoverage(decision, evidence.cases);

    return {
      ...decision,
      evidenceKeys: evidence.keys,
      caseCount: evidence.cases.length,
      ignoredCaseCount: coverage.ignoredCaseCount,
      covered: coverage.covered,
      conditionCoverage: coverage.conditions,
    };
  });

  const totalConditions = results.reduce(
    (sum, decision) => sum + decision.conditions.length,
    0,
  );
  const coveredConditions = results.reduce(
    (sum, decision) =>
      sum +
      decision.conditionCoverage.filter(condition => condition.covered).length,
    0,
  );

  return {
    summary: {
      decisions: results.length,
      coveredDecisions: results.filter(decision => decision.covered).length,
      missingDecisions: results.filter(decision => !decision.covered).length,
      conditions: totalConditions,
      coveredConditions,
      missingConditions: totalConditions - coveredConditions,
    },
    decisions: results,
  };
}

export function evaluateDecisionCoverage(decision, cases) {
  const conditionNames = decision.conditions.map(condition => condition.name);
  const validCases = cases.filter(testCase =>
    isCompleteCase(testCase, conditionNames),
  );
  const conditions = decision.conditions.map(condition => {
    const pair = findIndependencePair(
      condition.name,
      conditionNames,
      validCases,
    );

    return {
      ...condition,
      covered: pair !== null,
      pair: pair?.map(formatCaseReference) ?? [],
    };
  });

  return {
    covered: conditions.every(condition => condition.covered),
    ignoredCaseCount: cases.length - validCases.length,
    conditions,
  };
}

export function formatTextReport(report) {
  const status = report.summary.missingConditions === 0 ? "PASS" : "FAIL";
  const lines = [
    `MC/DC report: ${status}`,
    `Decisions: ${report.summary.coveredDecisions}/${report.summary.decisions} covered`,
    `Conditions: ${report.summary.coveredConditions}/${report.summary.conditions} covered`,
    "",
  ];

  for (const decision of report.decisions) {
    const decisionStatus = decision.covered ? "PASS" : "FAIL";
    const location = `${decision.sourcePath}:${decision.line}:${decision.column}`;

    lines.push(
      `[${decisionStatus}] ${location} ${decision.kind} (${decision.conditions.length} condition(s), ${decision.caseCount} case(s))`,
    );
    lines.push(`  id: ${decision.id}`);
    lines.push(`  expression: ${decision.expression}`);

    for (const condition of decision.conditionCoverage) {
      const conditionStatus = condition.covered ? "covered" : "missing";
      const pair =
        condition.pair.length > 0 ? ` via ${condition.pair.join(" <-> ")}` : "";

      lines.push(
        `  - ${condition.name} ${conditionStatus}: ${condition.text}${pair}`,
      );
    }

    if (decision.ignoredCaseCount > 0) {
      lines.push(`  ignored incomplete case(s): ${decision.ignoredCaseCount}`);
    }

    lines.push("");
  }

  return lines.join("\n").trimEnd();
}

export function normalizeExpressionText(text) {
  return text.replace(/\s+/g, " ").trim();
}

export function createDecisionStableKey(decision, occurrenceIndex) {
  return [
    decision.sourcePath,
    decision.providerId,
    decision.kind,
    decision.expressionHash,
    decision.conditionsHash,
    occurrenceIndex,
  ].join(":");
}

export function getDecisionStableBase(decision) {
  return [
    decision.sourcePath,
    decision.providerId,
    decision.kind,
    decision.expressionHash,
    decision.conditionsHash,
  ].join(":");
}

function withStableKeys(decisions) {
  const occurrenceCounts = new Map();

  return decisions.map(decision => {
    const stableBase = getDecisionStableBase(decision);
    const occurrenceIndex = (occurrenceCounts.get(stableBase) ?? 0) + 1;

    occurrenceCounts.set(stableBase, occurrenceIndex);

    return {
      ...decision,
      occurrenceIndex,
      stableKey: createDecisionStableKey(decision, occurrenceIndex),
    };
  });
}

function collectAtomicConditions(expression, sourceFile) {
  const atoms = [];

  const addAtom = node => {
    atoms.push({
      name: `C${atoms.length + 1}`,
      text: normalizeExpressionText(node.getText(sourceFile)),
    });
  };

  const visitExpression = node => {
    const expressionNode = unwrapExpression(node);

    if (isLogicalBinaryExpression(expressionNode)) {
      visitExpression(expressionNode.left);
      visitExpression(expressionNode.right);
      return;
    }

    if (isNegatedLogicalExpression(expressionNode)) {
      visitExpression(expressionNode.operand);
      return;
    }

    addAtom(expressionNode);
  };

  visitExpression(expression);

  return atoms;
}

function collectBooleanDecisionConstNames(sourceFile) {
  const names = new Set();

  const visit = node => {
    if (isConstVariableDeclaration(node) && isBooleanConstName(node.name)) {
      const initializer = unwrapExpression(node.initializer);

      if (
        isSupportedArrayPredicateCall(initializer) ||
        hasCompoundBooleanExpression(initializer)
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
  expression,
  booleanDecisionConstNames,
) {
  const unwrapped = unwrapExpression(expression);

  return (
    ts.isIdentifier(unwrapped) && booleanDecisionConstNames.has(unwrapped.text)
  );
}

function isConstVariableDeclaration(node) {
  return (
    ts.isVariableDeclaration(node) &&
    node.initializer !== undefined &&
    ts.isIdentifier(node.name) &&
    ts.isVariableDeclarationList(node.parent) &&
    (node.parent.flags & ts.NodeFlags.Const) !== 0
  );
}

function isBooleanConstName(name) {
  return ts.isIdentifier(name) && BOOLEAN_CONST_PREFIX.test(name.text);
}

function hasCompoundBooleanExpression(expression) {
  const unwrapped = unwrapExpression(expression);

  if (isLogicalBinaryExpression(unwrapped)) {
    return true;
  }

  if (isNegatedLogicalExpression(unwrapped)) {
    return true;
  }

  return (
    ts.isConditionalExpression(unwrapped) &&
    (hasCompoundBooleanExpression(unwrapped.whenTrue) ||
      hasCompoundBooleanExpression(unwrapped.whenFalse))
  );
}

function isSupportedArrayPredicateCall(node) {
  return getPredicateDecisionExpression(node) !== null;
}

function getPredicateDecisionExpression(node) {
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

function unwrapExpression(node) {
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

function isLogicalBinaryExpression(node) {
  return (
    ts.isBinaryExpression(node) &&
    (node.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken ||
      node.operatorToken.kind === ts.SyntaxKind.BarBarToken)
  );
}

function isNegatedLogicalExpression(node) {
  return (
    ts.isPrefixUnaryExpression(node) &&
    node.operator === ts.SyntaxKind.ExclamationToken &&
    isLogicalBinaryExpression(unwrapExpression(node.operand))
  );
}

function getProviderId(kind) {
  if (kind === "boolean-const") {
    return "typescript-boolean-const";
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

function parseJsonEvidence(text, evidenceFile) {
  const parsed = JSON.parse(text);
  const casesByDecision = new Map();

  if (Array.isArray(parsed)) {
    for (const entry of parsed) {
      appendEvidenceCases(
        casesByDecision,
        entry.decision,
        normalizeCases(entry.cases ?? [entry], evidenceFile),
      );
    }

    return casesByDecision;
  }

  if (parsed.decisions && typeof parsed.decisions === "object") {
    for (const [decision, cases] of Object.entries(parsed.decisions)) {
      appendEvidenceCases(
        casesByDecision,
        decision,
        normalizeCases(cases, evidenceFile),
      );
    }
  }

  return casesByDecision;
}

function parseCommentEvidence(text, evidenceFile) {
  const casesByDecision = new Map();
  const comments = extractComments(text);

  for (const comment of comments) {
    if (!comment.includes("@mcdc")) {
      continue;
    }

    let currentDecision = null;

    for (const line of normalizeCommentLines(comment)) {
      const directive = line.replace(/^@mcdc\s*/u, "").trim();
      const decision = parseDecisionDirective(directive);

      if (decision !== null) {
        currentDecision = decision;
        continue;
      }

      if (currentDecision === null) {
        continue;
      }

      const testCase = parseCaseDirective(directive, evidenceFile);

      if (testCase !== null) {
        appendEvidenceCases(casesByDecision, currentDecision, [testCase]);
      }
    }
  }

  return casesByDecision;
}

function parseDecisionDirective(line) {
  const match = /^(?:decision|id)\s*[:=]\s*(.+)$/iu.exec(line);

  return match?.[1].trim() ?? null;
}

function parseCaseDirective(line, evidenceFile) {
  const match = /^case\s*[:=]\s*(.+?)\s*=>\s*(true|false|1|0)$/iu.exec(line);

  if (!match) {
    return null;
  }

  const conditions = {};
  const rawConditions = match[1]
    .split(",")
    .map(part => part.trim())
    .filter(Boolean);

  for (const rawCondition of rawConditions) {
    const conditionMatch =
      /^([A-Za-z][A-Za-z0-9_]*)\s*[:=]\s*(true|false|1|0)$/iu.exec(
        rawCondition,
      );

    if (!conditionMatch) {
      continue;
    }

    conditions[conditionMatch[1]] = parseBoolean(conditionMatch[2]);
  }

  return {
    name: match[1].trim(),
    conditions,
    outcome: parseBoolean(match[2]),
    evidenceFile,
  };
}

function normalizeCases(cases, evidenceFile) {
  if (!Array.isArray(cases)) {
    return [];
  }

  return cases.flatMap(testCase => {
    if (!testCase || typeof testCase !== "object") {
      return [];
    }

    return [
      {
        name: testCase.name ?? testCase.title ?? "unnamed",
        conditions: normalizeConditionMap(testCase.conditions),
        outcome: parseBoolean(testCase.outcome),
        evidenceFile,
      },
    ];
  });
}

function normalizeConditionMap(conditions) {
  if (!conditions || typeof conditions !== "object") {
    return {};
  }

  return Object.fromEntries(
    Object.entries(conditions).map(([name, value]) => [
      name,
      parseBoolean(value),
    ]),
  );
}

function parseBoolean(value) {
  if (value === true || value === "true" || value === 1 || value === "1") {
    return true;
  }

  if (value === false || value === "false" || value === 0 || value === "0") {
    return false;
  }

  return null;
}

function extractComments(text) {
  const comments = [];
  const blockCommentPattern = /\/\*[\s\S]*?\*\//gu;
  const lineCommentPattern = /^\s*\/\/.*$/gmu;

  for (const match of text.matchAll(blockCommentPattern)) {
    comments.push(match[0]);
  }

  for (const match of text.matchAll(lineCommentPattern)) {
    comments.push(match[0]);
  }

  return comments;
}

function normalizeCommentLines(comment) {
  return comment
    .replace(/^\/\*/u, "")
    .replace(/\*\/$/u, "")
    .split("\n")
    .map(line => line.replace(/^\s*(?:\/\/)?\s*\*?\s?/u, "").trim())
    .filter(Boolean);
}

function mergeEvidence(target, source) {
  for (const [decision, cases] of source.entries()) {
    appendEvidenceCases(target, decision, cases);
  }
}

function appendEvidenceCases(target, decision, cases) {
  if (!decision || cases.length === 0) {
    return;
  }

  const existing = target.get(decision) ?? [];

  target.set(decision, [...existing, ...cases]);
}

function resolveDecisionEvidence(decision, evidenceByDecision) {
  const keys = [
    decision.stableKey,
    decision.id,
    `${decision.sourcePath}:${decision.line}:${decision.column}`,
    `${decision.sourcePath}:${decision.line}`,
    `expression:${decision.expression}`,
  ];
  const cases = [];
  const matchedKeys = [];

  for (const key of keys) {
    const matchedCases = evidenceByDecision.get(key);

    if (matchedCases) {
      matchedKeys.push(key);
      cases.push(...matchedCases);
    }
  }

  return { keys: matchedKeys, cases };
}

function isCompleteCase(testCase, conditionNames) {
  return (
    testCase.outcome !== null &&
    conditionNames.every(name => typeof testCase.conditions[name] === "boolean")
  );
}

function findIndependencePair(conditionName, conditionNames, cases) {
  for (let firstIndex = 0; firstIndex < cases.length; firstIndex += 1) {
    for (
      let secondIndex = firstIndex + 1;
      secondIndex < cases.length;
      secondIndex += 1
    ) {
      const first = cases[firstIndex];
      const second = cases[secondIndex];

      if (first.outcome === second.outcome) {
        continue;
      }

      if (
        first.conditions[conditionName] === second.conditions[conditionName]
      ) {
        continue;
      }

      const otherConditionsMatch = conditionNames
        .filter(name => name !== conditionName)
        .every(name => first.conditions[name] === second.conditions[name]);

      if (otherConditionsMatch) {
        return [first, second];
      }
    }
  }

  return null;
}

function formatCaseReference(testCase) {
  return `${testCase.evidenceFile} (${testCase.name})`;
}

function collectFiles(inputPaths, extensions) {
  return inputPaths.flatMap(inputPath => {
    const absolutePath = path.resolve(inputPath);

    if (!fs.existsSync(absolutePath)) {
      throw new Error(`Path does not exist: ${inputPath}`);
    }

    const stats = fs.statSync(absolutePath);

    if (stats.isFile()) {
      return extensions.has(path.extname(absolutePath)) ? [absolutePath] : [];
    }

    if (!stats.isDirectory()) {
      return [];
    }

    return collectFilesFromDirectory(absolutePath, extensions);
  });
}

function collectFilesFromDirectory(directoryPath, extensions) {
  const result = [];
  const entries = fs.readdirSync(directoryPath, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!IGNORED_DIRECTORIES.has(entry.name)) {
        result.push(
          ...collectFilesFromDirectory(
            path.join(directoryPath, entry.name),
            extensions,
          ),
        );
      }

      continue;
    }

    if (entry.isFile() && extensions.has(path.extname(entry.name))) {
      result.push(path.join(directoryPath, entry.name));
    }
  }

  return result.sort();
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

function toPosixPath(filePath) {
  return filePath.split(path.sep).join(path.posix.sep);
}
