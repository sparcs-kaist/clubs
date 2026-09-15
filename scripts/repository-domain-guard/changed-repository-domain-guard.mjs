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

    const currentPath = path.resolve(repoRoot, changedFile.path);
    if (!fs.existsSync(currentPath)) {
      continue;
    }

    if (!isRepositorySourceFile(changedFile.path)) {
      continue;
    }

    if (path.basename(changedFile.path) === BOUNDARY_FILE_NAME) {
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
  const record = (node, kind, detected, reason, queryNode) => {
    const result = makeNode(sourceFile, node, kind, detected, reason);
    if (queryNode) {
      const query = makeNode(sourceFile, queryNode, kind, detected, reason);
      result.queryRange = {
        startLine: query.startLine,
        endLine: query.endLine,
      };
    }
    nodes.push(result);
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
            listRelationFieldsByDelegate: schema.listRelationFieldsByDelegate,
            sourceFile,
          })) {
            record(
              violation.node,
              "cross-boundary-relation-traversal",
              violation.detected,
              `${violation.detected} targets ${violation.targetDelegate}, which is outside ${boundary.filePath}`,
              node,
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
  listRelationFieldsByDelegate,
}) {
  const violations = [];
  const visited = new Map();
  const containers = new Set([
    "include",
    "select",
    "where",
    "orderBy",
    "_count",
    "having",
    "data",
    "create",
    "update",
    "createMany",
    "updateMany",
    "upsert",
    "connect",
    "connectOrCreate",
    "disconnect",
    "set",
    "delete",
    "deleteMany",
    "some",
    "every",
    "none",
    "is",
    "isNot",
    "AND",
    "OR",
    "NOT",
  ]);
  const inspect = (expression, currentDelegate, countAll = false) => {
    if (!expression) return;
    const value = unwrapExpression(expression);
    const delegates = visited.get(value) ?? new Set();
    const context = `${currentDelegate}:${countAll}`;
    if (delegates.has(context)) return;
    delegates.add(context);
    visited.set(value, delegates);
    if (ts.isIdentifier(value)) {
      inspect(findLocalInitializer(value), currentDelegate, countAll);
      return;
    }
    const relations =
      relationFieldsByDelegate.get(currentDelegate) ?? new Map();
    if (countAll && value.kind === ts.SyntaxKind.TrueKeyword) {
      for (const relation of listRelationFieldsByDelegate.get(
        currentDelegate,
      ) ?? []) {
        const targetDelegate = relations.get(relation);
        if (!ownedPrismaModels.has(targetDelegate)) {
          violations.push({
            node: value,
            detected: `${currentDelegate}.${relation}`,
            targetDelegate,
          });
        }
      }
    }
    if (ts.isArrayLiteralExpression(value)) {
      value.elements.forEach(item => inspect(item, currentDelegate));
      return;
    }
    if (!ts.isObjectLiteralExpression(value)) return;
    for (const property of value.properties) {
      if (ts.isSpreadAssignment(property)) {
        inspect(property.expression, currentDelegate);
        continue;
      }
      if (
        !ts.isPropertyAssignment(property) &&
        !ts.isShorthandPropertyAssignment(property)
      )
        continue;
      const name = getPropertyNameText(property.name);
      const initializer = ts.isPropertyAssignment(property)
        ? property.initializer
        : property.name;
      const targetDelegate = relations.get(name);
      if (targetDelegate) {
        if (!ownedPrismaModels.has(targetDelegate)) {
          violations.push({
            node: property.name,
            detected: `${currentDelegate}.${name}`,
            targetDelegate,
          });
        } else {
          inspect(initializer, targetDelegate);
        }
      } else if (containers.has(name)) {
        inspect(initializer, currentDelegate, name === "_count");
      }
    }
  };
  inspect(callNode.arguments[0], rootModelDelegate);
  return violations;
}

function findLocalInitializer(identifier) {
  // Resolve literals declared in the same lexical scope; never execute source.
  for (let scope = identifier.parent; scope; scope = scope.parent) {
    if (
      ts.isFunctionLike(scope) &&
      scope.parameters.some(
        parameter =>
          ts.isIdentifier(parameter.name) &&
          parameter.name.text === identifier.text,
      )
    ) {
      return undefined;
    }
    if (!ts.isBlock(scope) && !ts.isSourceFile(scope)) continue;
    for (const statement of scope.statements) {
      if (!ts.isVariableStatement(statement)) continue;
      for (const declaration of statement.declarationList.declarations) {
        if (
          ts.isIdentifier(declaration.name) &&
          declaration.name.text === identifier.text
        ) {
          return declaration.initializer;
        }
      }
    }
  }
  return undefined;
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
        exportedPrismaModels: new Set(result.boundary.exportedPrismaModels),
        importedModels: new Set(),
      });
    }
  }

  violations.push(...validateBoundaryModelsExist({ boundaries, schema }));
  violations.push(...validateBoundaryModelUniqueness(boundaries));
  violations.push(...validateBoundaryImports(boundaries));
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
  const allowedFields = new Set([
    "ownedPrismaModels",
    "exportedPrismaModels",
    "importedPrismaModels",
  ]);
  const ownedProperty = properties.find(
    property => getPropertyNameText(property.name) === "ownedPrismaModels",
  );
  const extraProperty = properties.find(
    property => !allowedFields.has(getPropertyNameText(property.name)),
  );

  if (extraProperty) {
    violations.push(
      makeNode(
        sourceFile,
        extraProperty.name,
        "invalid-repository-boundary",
        getPropertyNameText(extraProperty.name),
        "repositoryBoundary only supports ownedPrismaModels, exportedPrismaModels and importedPrismaModels",
      ),
    );
  }

  if (properties.length !== initializer.properties.length) {
    violations.push(
      makeNode(
        sourceFile,
        initializer,
        "invalid-repository-boundary",
        "repositoryBoundary",
        "repositoryBoundary fields must be explicit property assignments",
      ),
    );
  }
  if (
    new Set(properties.map(property => getPropertyNameText(property.name)))
      .size !== properties.length
  ) {
    violations.push(
      makeNode(
        sourceFile,
        initializer,
        "invalid-repository-boundary",
        "repositoryBoundary",
        "repositoryBoundary fields must not be duplicated",
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

  const invalid = (node, reason) =>
    violations.push(
      makeNode(
        sourceFile,
        node,
        "invalid-repository-boundary",
        node.getText(sourceFile),
        reason,
      ),
    );
  const readModels = (expression, label) => {
    const value = unwrapExpression(expression);
    if (!value || !ts.isArrayLiteralExpression(value)) {
      invalid(
        expression ?? initializer,
        `${label} must be a static string literal array`,
      );
      return [];
    }
    const models = [];
    for (const element of value.elements) {
      if (
        !ts.isStringLiteral(element) &&
        !ts.isNoSubstitutionTemplateLiteral(element)
      ) {
        invalid(element, `${label} must contain only string literals`);
      } else if (models.includes(element.text)) {
        invalid(element, `${label} must not contain duplicates`);
      } else {
        models.push(element.text);
      }
    }
    return models;
  };
  const ownedPrismaModels = readModels(
    ownedProperty.initializer,
    "ownedPrismaModels",
  );
  const exportedProperty = findPropertyAssignment(
    initializer,
    "exportedPrismaModels",
  );
  const exportedPrismaModels = exportedProperty
    ? readModels(exportedProperty.initializer, "exportedPrismaModels")
    : [];
  const importedPrismaModels = [];
  const importedProperty = findPropertyAssignment(
    initializer,
    "importedPrismaModels",
  );
  if (importedProperty) {
    const imports = unwrapExpression(importedProperty.initializer);
    if (!ts.isArrayLiteralExpression(imports)) {
      invalid(imports, "importedPrismaModels must be a static array");
    } else {
      for (const entry of imports.elements) {
        const value = unwrapExpression(entry);
        if (!ts.isObjectLiteralExpression(value)) {
          invalid(
            entry,
            "each import must be an explicit { from, models } object",
          );
          continue;
        }
        const from = findPropertyAssignment(value, "from")?.initializer;
        const models = findPropertyAssignment(value, "models")?.initializer;
        const names = value.properties.map(property =>
          ts.isPropertyAssignment(property)
            ? getPropertyNameText(property.name)
            : null,
        );
        if (
          names.length !== 2 ||
          !names.includes("from") ||
          !names.includes("models")
        ) {
          invalid(value, "each import must contain only from and models");
        }
        if (
          !from ||
          !ts.isStringLiteral(from) ||
          path.posix.isAbsolute(from.text) ||
          path.posix.normalize(from.text) !== from.text ||
          from.text.startsWith("../") ||
          from.text.includes("\\") ||
          path.posix.basename(from.text) !== BOUNDARY_FILE_NAME
        ) {
          invalid(
            from ?? value,
            "from must be a static repository-root-relative boundary manifest path",
          );
          continue;
        }
        importedPrismaModels.push({
          from: from.text,
          models: readModels(models, "import models"),
        });
      }
    }
  }

  return {
    boundary: {
      filePath,
      ownedPrismaModels,
      exportedPrismaModels,
      importedPrismaModels,
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

function validateBoundaryImports(boundaries) {
  const index = new Map(
    boundaries.map(boundary => [boundary.filePath, boundary]),
  );
  const violations = [];
  for (const boundary of boundaries) {
    const invalid = (kind, detected, reason) =>
      violations.push({
        filePath: boundary.filePath,
        line: 1,
        column: 1,
        kind,
        detected,
        reason,
      });
    for (const model of boundary.exportedPrismaModels) {
      if (!boundary.ownedPrismaModels.has(model)) {
        invalid(
          "invalid-boundary-export",
          model,
          "only models owned by this boundary can be exported",
        );
      }
    }
    for (const imported of boundary.importedPrismaModels) {
      const owner = index.get(imported.from);
      if (!owner) {
        invalid(
          "invalid-boundary-import",
          imported.from,
          "import source must resolve to a declared repository boundary",
        );
        continue;
      }
      for (const model of imported.models) {
        if (boundary.ownedPrismaModels.has(model)) {
          invalid(
            "invalid-boundary-import",
            model,
            "owned models must not also be imported",
          );
        } else if (!owner.ownedPrismaModels.has(model)) {
          invalid(
            "invalid-boundary-import",
            model,
            `${imported.from} does not own ${model}; import from its actual owner`,
          );
        } else if (!owner.exportedPrismaModels.has(model)) {
          invalid(
            "invalid-boundary-import",
            model,
            `${imported.from} does not export ${model}`,
          );
        } else if (boundary.importedModels.has(model)) {
          invalid(
            "invalid-boundary-import",
            model,
            "a model must not be imported more than once",
          );
        } else {
          boundary.importedModels.add(model);
        }
      }
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
        if (
          boundary.ownedPrismaModels.has(targetDelegate) ||
          boundary.importedModels.has(targetDelegate)
        ) {
          continue;
        }

        violations.push({
          filePath: boundary.filePath,
          line: 1,
          column: 1,
          kind: "cross-boundary-schema-relation",
          detected: `${modelDelegate}.${fieldName}`,
          reason: `${modelDelegate}.${fieldName} targets ${targetDelegate}, which must be owned or explicitly imported from its exporting owner in ${boundary.filePath}`,
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
  const listRelationFieldsByDelegate = new Map();

  for (const [modelName, body] of modelBodies) {
    const modelDelegate = toPrismaDelegateName(modelName);
    const relationFields = new Map();
    const listRelationFields = new Set();

    for (const line of body.split("\n")) {
      const field = parsePrismaFieldLine(line);
      if (!field || !modelNames.has(field.typeName)) {
        continue;
      }

      relationFields.set(field.name, toPrismaDelegateName(field.typeName));
      if (field.isList) listRelationFields.add(field.name);
    }

    relationFieldsByDelegate.set(modelDelegate, relationFields);
    listRelationFieldsByDelegate.set(modelDelegate, listRelationFields);
  }

  return {
    delegates,
    relationFieldsByDelegate,
    listRelationFieldsByDelegate,
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
    /^(?<name>[A-Za-z_][A-Za-z0-9_]*)\s+(?<typeName>[A-Za-z][A-Za-z0-9_]*)(?<list>\[\])?\??(?:\s|$)/u,
  );

  if (!match) {
    return null;
  }

  return {
    name: match.groups.name,
    typeName: match.groups.typeName,
    isList: Boolean(match.groups.list),
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
  if (isStaticPropertyName(name)) {
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
    (node.queryRange &&
      isNodeTouchedByChangedLines(node.queryRange, changedFile)) ||
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
      node.queryRange?.startLine,
      node.queryRange?.endLine,
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

function isStaticStringLiteral(node) {
  return ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node);
}

function isStaticPropertyName(node) {
  return (
    ts.isIdentifier(node) ||
    isStaticStringLiteral(node) ||
    ts.isNumericLiteral(node)
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
