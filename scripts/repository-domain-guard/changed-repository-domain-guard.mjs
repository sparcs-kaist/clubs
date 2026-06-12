#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import ts from "typescript";

const DEFAULT_CHANGED_FROM = "origin/dev";
const DEFAULT_SOURCE = "packages/api/src";
const DEFAULT_SCHEMA = "packages/api/prisma/schema.prisma";
const BOUNDARY_FILE_NAME = "repository-boundary.ts";
const PRISMA_OPERATIONS = new Set([
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
    sourcePaths: args.sources,
  });
  const changedFiles = parseChangedFileLineMap(diffText);
  const violations = findChangedRepositoryDomainViolations({
    changedFiles,
    repoRoot,
    schemaPath: args.schema,
    sourceRoot: args.sources[0] ?? DEFAULT_SOURCE,
  });

  if (violations.length === 0) {
    console.log(
      `No repository domain guard violations found relative to ${args.changedFrom}.`,
    );
    return;
  }

  console.error(formatViolations(violations));
  process.exitCode = 1;
}

export function findChangedRepositoryDomainViolations({
  changedFiles,
  repoRoot = process.cwd(),
  schemaPath = DEFAULT_SCHEMA,
  sourceRoot = DEFAULT_SOURCE,
}) {
  const schema = readPrismaSchemaIndex(repoRoot, schemaPath);
  const boundaryIndex = readRepositoryBoundaryIndex({
    repoRoot,
    sourceRoot,
    schema,
  });
  const violations = [...boundaryIndex.violations];

  for (const changedFile of changedFiles) {
    if (!isApiProductionTypeScriptFile(changedFile.path)) {
      continue;
    }

    if (!isRepositorySourceFile(changedFile.path)) {
      continue;
    }

    if (path.basename(changedFile.path) === BOUNDARY_FILE_NAME) {
      continue;
    }

    const currentPath = path.resolve(repoRoot, changedFile.path);
    if (!fs.existsSync(currentPath)) {
      continue;
    }

    const sourceText = fs.readFileSync(currentPath, "utf8");
    const result = findRepositoryDomainGuardNodes({
      sourceText,
      filePath: changedFile.path,
      boundaryIndex,
      schema,
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

function findRepositoryDomainGuardNodes({
  sourceText,
  filePath,
  boundaryIndex,
  schema,
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

  const boundary = findNearestBoundary(filePath, boundaryIndex);
  const aliasIndex = buildPrismaAliasIndex(sourceFile);
  const nodes = [];
  const record = (node, kind, detected, reason) => {
    nodes.push(makeNode(sourceFile, node, kind, detected, reason));
  };

  const visit = node => {
    if (ts.isCallExpression(node)) {
      const call = getPrismaModelOperation(node.expression, aliasIndex);

      if (call) {
        const detected = node.expression.getText(sourceFile);

        if (!boundary) {
          record(
            node,
            "missing-repository-boundary",
            detected,
            `repository files that query Prisma must have a nearest ${BOUNDARY_FILE_NAME}`,
          );
        } else if (!boundary.ownedPrismaModels.has(call.modelDelegate)) {
          record(
            node,
            "cross-boundary-prisma-model",
            detected,
            `${call.modelDelegate} is not declared in ${boundary.filePath}`,
          );
        } else {
          for (const violation of findRelationTraversalViolations({
            callNode: node,
            rootModelDelegate: call.modelDelegate,
            ownedPrismaModels: boundary.ownedPrismaModels,
            relationFieldsByDelegate: schema.relationFieldsByDelegate,
            sourceFile,
          })) {
            record(
              violation.node,
              "cross-boundary-relation-traversal",
              violation.detected,
              `${violation.detected} targets ${violation.targetDelegate}, which is outside ${boundary.filePath}`,
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

function findRelationTraversalViolations({
  callNode,
  rootModelDelegate,
  ownedPrismaModels,
  relationFieldsByDelegate,
  sourceFile,
}) {
  const argument = callNode.arguments[0];
  if (!argument || !ts.isObjectLiteralExpression(argument)) {
    return [];
  }

  const violations = [];
  const include = findPropertyAssignment(argument, "include");
  const select = findPropertyAssignment(argument, "select");

  if (include) {
    inspectRelationProjection({
      expression: include.initializer,
      currentDelegate: rootModelDelegate,
      ownedPrismaModels,
      relationFieldsByDelegate,
      sourceFile,
      violations,
    });
  }

  if (select) {
    inspectRelationProjection({
      expression: select.initializer,
      currentDelegate: rootModelDelegate,
      ownedPrismaModels,
      relationFieldsByDelegate,
      sourceFile,
      violations,
    });
  }

  return violations;
}

function inspectRelationProjection({
  expression,
  currentDelegate,
  ownedPrismaModels,
  relationFieldsByDelegate,
  sourceFile,
  violations,
}) {
  const objectLiteral = unwrapExpression(expression);
  if (!ts.isObjectLiteralExpression(objectLiteral)) {
    return;
  }

  const relationFields =
    relationFieldsByDelegate.get(currentDelegate) ?? new Map();

  for (const property of objectLiteral.properties) {
    if (!ts.isPropertyAssignment(property)) {
      continue;
    }

    const propertyName = getPropertyNameText(property.name);
    const targetDelegate = relationFields.get(propertyName);

    if (!targetDelegate) {
      continue;
    }

    const detected = `${currentDelegate}.${propertyName}`;

    if (!ownedPrismaModels.has(targetDelegate)) {
      violations.push({
        node: property.name,
        detected,
        targetDelegate,
      });
      continue;
    }

    inspectNestedProjection({
      expression: property.initializer,
      currentDelegate: targetDelegate,
      ownedPrismaModels,
      relationFieldsByDelegate,
      sourceFile,
      violations,
    });
  }
}

function inspectNestedProjection({
  expression,
  currentDelegate,
  ownedPrismaModels,
  relationFieldsByDelegate,
  sourceFile,
  violations,
}) {
  const objectLiteral = unwrapExpression(expression);
  if (!ts.isObjectLiteralExpression(objectLiteral)) {
    return;
  }

  const include = findPropertyAssignment(objectLiteral, "include");
  const select = findPropertyAssignment(objectLiteral, "select");

  if (include) {
    inspectRelationProjection({
      expression: include.initializer,
      currentDelegate,
      ownedPrismaModels,
      relationFieldsByDelegate,
      sourceFile,
      violations,
    });
  }

  if (select) {
    inspectRelationProjection({
      expression: select.initializer,
      currentDelegate,
      ownedPrismaModels,
      relationFieldsByDelegate,
      sourceFile,
      violations,
    });
  }
}

function readRepositoryBoundaryIndex({ repoRoot, sourceRoot, schema }) {
  const absoluteSourceRoot = path.resolve(repoRoot, sourceRoot);
  const boundaries = [];
  const violations = [];

  if (!fs.existsSync(absoluteSourceRoot)) {
    return {
      boundaries,
      violations,
    };
  }

  for (const absolutePath of walkFiles(absoluteSourceRoot)) {
    if (path.basename(absolutePath) !== BOUNDARY_FILE_NAME) {
      continue;
    }

    const filePath = toPosixPath(path.relative(repoRoot, absolutePath));
    const sourceText = fs.readFileSync(absolutePath, "utf8");
    const result = parseRepositoryBoundary({
      sourceText,
      filePath,
    });

    if (result.parseError) {
      violations.push({
        filePath,
        line: result.parseError.line,
        column: result.parseError.column,
        kind: "parse-error",
        detected: "TypeScript parse error",
        reason: result.parseError.message,
      });
      continue;
    }

    violations.push(...result.violations);

    if (result.boundary) {
      boundaries.push({
        ...result.boundary,
        directory: toPosixPath(path.dirname(filePath)),
        ownedPrismaModels: new Set(result.boundary.ownedPrismaModels),
      });
    }
  }

  violations.push(...validateBoundaryModelsExist({ boundaries, schema }));
  violations.push(...validateBoundaryModelUniqueness(boundaries));
  violations.push(
    ...validateBoundaryRelationsStayInside({ boundaries, schema }),
  );

  return {
    boundaries,
    violations,
  };
}

function parseRepositoryBoundary({ sourceText, filePath }) {
  const sourceFile = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );

  if (sourceFile.parseDiagnostics.length > 0) {
    return {
      boundary: null,
      violations: [],
      parseError: formatParseDiagnostic(sourceFile),
    };
  }

  const violations = [];
  let boundaryDeclaration = null;

  const visit = node => {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === "repositoryBoundary"
    ) {
      boundaryDeclaration = node;
      return;
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);

  if (!boundaryDeclaration) {
    violations.push(
      makeNode(
        sourceFile,
        sourceFile,
        "invalid-repository-boundary",
        BOUNDARY_FILE_NAME,
        "repository-boundary.ts must export const repositoryBoundary",
      ),
    );
    return {
      boundary: null,
      violations,
      parseError: null,
    };
  }

  const initializer = unwrapExpression(boundaryDeclaration.initializer);
  if (!initializer || !ts.isObjectLiteralExpression(initializer)) {
    violations.push(
      makeNode(
        sourceFile,
        boundaryDeclaration,
        "invalid-repository-boundary",
        "repositoryBoundary",
        "repositoryBoundary must be a static object literal",
      ),
    );
    return {
      boundary: null,
      violations,
      parseError: null,
    };
  }

  const properties = initializer.properties.filter(ts.isPropertyAssignment);
  const ownedProperty = properties.find(
    property => getPropertyNameText(property.name) === "ownedPrismaModels",
  );
  const extraProperty = properties.find(
    property => getPropertyNameText(property.name) !== "ownedPrismaModels",
  );

  if (extraProperty) {
    violations.push(
      makeNode(
        sourceFile,
        extraProperty.name,
        "invalid-repository-boundary",
        getPropertyNameText(extraProperty.name),
        "repositoryBoundary v1 only supports ownedPrismaModels",
      ),
    );
  }

  if (!ownedProperty) {
    violations.push(
      makeNode(
        sourceFile,
        initializer,
        "invalid-repository-boundary",
        "repositoryBoundary",
        "repositoryBoundary must declare ownedPrismaModels",
      ),
    );
    return {
      boundary: null,
      violations,
      parseError: null,
    };
  }

  const ownedInitializer = unwrapExpression(ownedProperty.initializer);
  if (!ts.isArrayLiteralExpression(ownedInitializer)) {
    violations.push(
      makeNode(
        sourceFile,
        ownedProperty.name,
        "invalid-repository-boundary",
        "ownedPrismaModels",
        "ownedPrismaModels must be a static string literal array",
      ),
    );
    return {
      boundary: null,
      violations,
      parseError: null,
    };
  }

  const ownedPrismaModels = [];
  for (const element of ownedInitializer.elements) {
    if (
      !ts.isStringLiteral(element) &&
      !ts.isNoSubstitutionTemplateLiteral(element)
    ) {
      violations.push(
        makeNode(
          sourceFile,
          element,
          "invalid-repository-boundary",
          element.getText(sourceFile),
          "ownedPrismaModels must contain only string literals",
        ),
      );
      continue;
    }

    ownedPrismaModels.push(element.text);
  }

  return {
    boundary: {
      filePath,
      ownedPrismaModels,
    },
    violations,
    parseError: null,
  };
}

function validateBoundaryModelsExist({ boundaries, schema }) {
  const violations = [];

  for (const boundary of boundaries) {
    for (const modelDelegate of boundary.ownedPrismaModels) {
      if (schema.delegates.has(modelDelegate)) {
        continue;
      }

      violations.push({
        filePath: boundary.filePath,
        line: 1,
        column: 1,
        kind: "unknown-owned-prisma-model",
        detected: modelDelegate,
        reason: `${modelDelegate} is not a Prisma model delegate in ${DEFAULT_SCHEMA}`,
      });
    }
  }

  return violations;
}

function validateBoundaryModelUniqueness(boundaries) {
  const owners = new Map();
  const violations = [];

  for (const boundary of boundaries) {
    for (const modelDelegate of boundary.ownedPrismaModels) {
      const owner = owners.get(modelDelegate);

      if (!owner) {
        owners.set(modelDelegate, boundary);
        continue;
      }

      violations.push({
        filePath: boundary.filePath,
        line: 1,
        column: 1,
        kind: "duplicate-owned-prisma-model",
        detected: modelDelegate,
        reason: `${modelDelegate} is already owned by ${owner.filePath}`,
      });
    }
  }

  return violations;
}

function validateBoundaryRelationsStayInside({ boundaries, schema }) {
  const violations = [];

  for (const boundary of boundaries) {
    for (const modelDelegate of boundary.ownedPrismaModels) {
      const relationFields =
        schema.relationFieldsByDelegate.get(modelDelegate) ?? new Map();

      for (const [fieldName, targetDelegate] of relationFields) {
        if (boundary.ownedPrismaModels.has(targetDelegate)) {
          continue;
        }

        violations.push({
          filePath: boundary.filePath,
          line: 1,
          column: 1,
          kind: "cross-boundary-schema-relation",
          detected: `${modelDelegate}.${fieldName}`,
          reason: `${modelDelegate}.${fieldName} targets ${targetDelegate}, which is outside ${boundary.filePath}; keep only the scalar id field or move the target into the same boundary`,
        });
      }
    }
  }

  return violations;
}

function readPrismaSchemaIndex(repoRoot, schemaPath) {
  const absoluteSchemaPath = path.resolve(repoRoot, schemaPath);

  if (!fs.existsSync(absoluteSchemaPath)) {
    throw new Error(`Prisma schema not found: ${schemaPath}`);
  }

  const schemaText = fs.readFileSync(absoluteSchemaPath, "utf8");
  const modelBodies = readPrismaModelBodies(schemaText);
  const modelNames = new Set(modelBodies.keys());
  const delegates = new Set(
    [...modelNames].map(modelName => toPrismaDelegateName(modelName)),
  );
  const relationFieldsByDelegate = new Map();

  for (const [modelName, body] of modelBodies) {
    const modelDelegate = toPrismaDelegateName(modelName);
    const relationFields = new Map();

    for (const line of body.split("\n")) {
      const field = parsePrismaFieldLine(line);
      if (!field || !modelNames.has(field.typeName)) {
        continue;
      }

      relationFields.set(field.name, toPrismaDelegateName(field.typeName));
    }

    relationFieldsByDelegate.set(modelDelegate, relationFields);
  }

  return {
    delegates,
    relationFieldsByDelegate,
  };
}

function readPrismaModelBodies(schemaText) {
  const modelBodies = new Map();
  const modelRegex = /\bmodel\s+([A-Za-z][A-Za-z0-9_]*)\s*\{/gu;
  let match;

  while ((match = modelRegex.exec(schemaText)) !== null) {
    const modelName = match[1];
    const bodyStart = modelRegex.lastIndex;
    const bodyEnd = findMatchingBrace(schemaText, bodyStart - 1);

    if (bodyEnd === -1) {
      continue;
    }

    modelBodies.set(modelName, schemaText.slice(bodyStart, bodyEnd));
  }

  return modelBodies;
}

function parsePrismaFieldLine(line) {
  const trimmed = line.trim();
  if (
    trimmed === "" ||
    trimmed.startsWith("//") ||
    trimmed.startsWith("@") ||
    trimmed.startsWith("@@")
  ) {
    return null;
  }

  const match = trimmed.match(
    /^(?<name>[A-Za-z_][A-Za-z0-9_]*)\s+(?<typeName>[A-Za-z][A-Za-z0-9_]*)(?:\[\])?\??(?:\s|$)/u,
  );

  if (!match) {
    return null;
  }

  return {
    name: match.groups.name,
    typeName: match.groups.typeName,
  };
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

function buildPrismaAliasIndex(sourceFile) {
  const rootAliases = new Set(["prisma", "tx"]);
  const delegateAliases = new Map();

  const visit = node => {
    if (ts.isVariableDeclaration(node) && node.initializer) {
      if (ts.isIdentifier(node.name)) {
        const initializer = unwrapExpression(node.initializer);
        const delegate = getPrismaDelegateFromExpression(
          initializer,
          rootAliases,
        );

        if (delegate) {
          delegateAliases.set(node.name.text, delegate);
        } else if (isPrismaRootExpression(initializer, rootAliases)) {
          rootAliases.add(node.name.text);
        }
      } else if (ts.isObjectBindingPattern(node.name)) {
        const initializer = unwrapExpression(node.initializer);

        if (isPrismaRootExpression(initializer, rootAliases)) {
          for (const element of node.name.elements) {
            if (!ts.isIdentifier(element.name)) {
              continue;
            }

            const propertyName = element.propertyName
              ? getPropertyNameText(element.propertyName)
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

  return {
    rootAliases,
    delegateAliases,
  };
}

function getPrismaDelegateFromExpression(expression, rootAliases) {
  if (!isStaticAccessExpression(expression)) {
    return "";
  }

  const chain = getPropertyAccessChain(expression);

  if (chain.length === 3 && chain[0] === "this" && chain[1] === "prisma") {
    return chain[2];
  }

  if (
    chain.length === 4 &&
    chain[0] === "this" &&
    chain[1] === "txHost" &&
    chain[2] === "tx"
  ) {
    return chain[3];
  }

  if (chain.length === 2 && rootAliases.has(chain[0])) {
    return chain[1];
  }

  return "";
}

function isPrismaRootExpression(expression, rootAliases) {
  if (!expression) {
    return false;
  }

  if (ts.isIdentifier(expression)) {
    return rootAliases.has(expression.text);
  }

  if (!isStaticAccessExpression(expression)) {
    return false;
  }

  const chain = getPropertyAccessChain(expression);

  return (
    (chain.length === 2 && chain[0] === "this" && chain[1] === "prisma") ||
    (chain.length === 3 &&
      chain[0] === "this" &&
      chain[1] === "txHost" &&
      chain[2] === "tx")
  );
}

function getPrismaModelOperation(expression, aliasIndex) {
  if (!isStaticAccessExpression(expression)) {
    return null;
  }

  const chain = getPropertyAccessChain(expression);
  const operation = chain.at(-1);
  const modelDelegate = chain.at(-2);

  if (!PRISMA_OPERATIONS.has(operation) || !modelDelegate) {
    return null;
  }

  if (chain.length >= 2 && aliasIndex.delegateAliases.has(chain[0])) {
    return {
      modelDelegate: aliasIndex.delegateAliases.get(chain[0]),
      operation,
    };
  }

  if (chain.length >= 4 && chain[0] === "this" && chain[1] === "prisma") {
    return {
      modelDelegate,
      operation,
    };
  }

  if (
    chain.length >= 5 &&
    chain[0] === "this" &&
    chain[1] === "txHost" &&
    chain[2] === "tx"
  ) {
    return {
      modelDelegate,
      operation,
    };
  }

  if (chain.length >= 3 && ["prisma", "tx"].includes(chain[0])) {
    return {
      modelDelegate,
      operation,
    };
  }

  if (chain.length >= 3 && aliasIndex.rootAliases.has(chain[0])) {
    return {
      modelDelegate,
      operation,
    };
  }

  return null;
}

function getPropertyAccessChain(expression) {
  const parts = [];
  let current = expression;

  while (isStaticAccessExpression(current)) {
    const accessName = getStaticAccessName(current);
    if (!accessName) {
      return [];
    }

    parts.unshift(accessName);
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

  if (
    ts.isStringLiteral(node.argumentExpression) ||
    ts.isNoSubstitutionTemplateLiteral(node.argumentExpression) ||
    ts.isNumericLiteral(node.argumentExpression)
  ) {
    return node.argumentExpression.text;
  }

  return "";
}

function findNearestBoundary(filePath, boundaryIndex) {
  const posixFilePath = toPosixPath(filePath);
  const directory = toPosixPath(path.posix.dirname(posixFilePath));
  const candidates = boundaryIndex.boundaries
    .filter(
      boundary =>
        directory === boundary.directory ||
        directory.startsWith(`${boundary.directory}/`),
    )
    .sort((left, right) => right.directory.length - left.directory.length);

  return candidates[0] ?? null;
}

function findPropertyAssignment(objectLiteral, propertyName) {
  return objectLiteral.properties.find(
    property =>
      ts.isPropertyAssignment(property) &&
      getPropertyNameText(property.name) === propertyName,
  );
}

function getPropertyNameText(name) {
  if (
    ts.isIdentifier(name) ||
    ts.isStringLiteral(name) ||
    ts.isNoSubstitutionTemplateLiteral(name) ||
    ts.isNumericLiteral(name)
  ) {
    return name.text;
  }

  return "";
}

function unwrapExpression(expression) {
  let current = expression;

  while (
    current &&
    (ts.isAsExpression(current) ||
      ts.isSatisfiesExpression(current) ||
      ts.isParenthesizedExpression(current))
  ) {
    current = current.expression;
  }

  return current;
}

function walkFiles(directory) {
  const files = [];

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...walkFiles(fullPath));
    } else if (entry.isFile()) {
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

function parseNewFilePath(line) {
  const filePath = line.replace(/^\+\+\+\s+/u, "");

  if (filePath === "/dev/null") {
    return null;
  }

  return filePath.replace(/^b\//u, "");
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

function makeNode(sourceFile, node, kind, detected, reason) {
  const start = node.getStart(sourceFile);
  const end = node.getEnd();
  const startPosition = sourceFile.getLineAndCharacterOfPosition(start);
  const endPosition = sourceFile.getLineAndCharacterOfPosition(
    Math.max(start, end - 1),
  );

  return {
    filePath: sourceFile.fileName,
    line: startPosition.line + 1,
    column: startPosition.character + 1,
    startLine: startPosition.line + 1,
    endLine: endPosition.line + 1,
    kind,
    detected,
    reason,
  };
}

function sortNodes(nodes) {
  return nodes.sort(
    (left, right) =>
      left.line - right.line ||
      left.column - right.column ||
      left.kind.localeCompare(right.kind),
  );
}

function dedupeNodes(nodes) {
  const seen = new Set();
  const result = [];

  for (const node of nodes) {
    const key = [
      node.filePath,
      node.line,
      node.column,
      node.kind,
      node.detected,
    ].join(":");

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(node);
  }

  return result;
}

function compareViolations(left, right) {
  return (
    left.filePath.localeCompare(right.filePath) ||
    left.line - right.line ||
    left.column - right.column ||
    left.kind.localeCompare(right.kind)
  );
}

function formatParseDiagnostic(sourceFile) {
  const diagnostic = sourceFile.parseDiagnostics[0];
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

function formatViolations(violations) {
  return violations
    .map(violation =>
      [
        `${violation.filePath}:${violation.line}:${violation.column}`,
        `${violation.kind}: ${violation.detected}`,
        `  ${violation.reason}`,
      ].join("\n"),
    )
    .join("\n\n");
}

function isApiProductionTypeScriptFile(filePath) {
  const normalized = toPosixPath(filePath);

  return (
    normalized.startsWith("packages/api/src/") &&
    normalized.endsWith(".ts") &&
    !normalized.endsWith(".spec.ts") &&
    !normalized.endsWith(".test.ts")
  );
}

function isRepositorySourceFile(filePath) {
  const normalized = toPosixPath(filePath);

  return (
    normalized.includes("/repository/") ||
    normalized.includes("/repository-old/") ||
    normalized.endsWith(".repository.ts")
  );
}

function toPrismaDelegateName(modelName) {
  return `${modelName.charAt(0).toLowerCase()}${modelName.slice(1)}`;
}

function toPosixPath(filePath) {
  return filePath.split(path.sep).join("/");
}

function parseArgs(argv) {
  const args = {
    changedFrom: DEFAULT_CHANGED_FROM,
    sources: [DEFAULT_SOURCE],
    schema: DEFAULT_SCHEMA,
    help: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "-h" || arg === "--help") {
      args.help = true;
      continue;
    }

    if (arg === "--changed-from") {
      args.changedFrom = argv[index + 1] ?? "";
      index += 1;
      continue;
    }

    if (arg === "--source") {
      args.sources = [argv[index + 1] ?? ""];
      index += 1;
      continue;
    }

    if (arg === "--schema") {
      args.schema = argv[index + 1] ?? "";
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return args;
}

function printHelp() {
  console.log(`Usage: node scripts/repository-domain-guard/changed-repository-domain-guard.mjs [options]

Options:
  --changed-from <ref>  Base ref for changed-line checks (default: origin/dev)
  --source <path>       Source path to scan (default: packages/api/src)
  --schema <path>       Prisma schema path (default: packages/api/prisma/schema.prisma)
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
