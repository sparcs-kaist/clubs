#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import ts from "typescript";

const DEFAULT_APP_DIR = "packages/web/src/app";
const DEFAULT_PATHS_FILE = "packages/web/src/constants/paths.ts";

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  const repoRoot = process.cwd();
  const appDir = path.resolve(repoRoot, args.appDir);
  const pathsFile = path.resolve(repoRoot, args.pathsFile);
  const routes = collectPageRoutes({ appDir, repoRoot });
  const allowlist = parseProductionReadyPaths(
    fs.readFileSync(pathsFile, "utf8"),
  );
  const violations = findPageAllowlistViolations({ allowlist, routes });

  if (violations.length === 0) {
    console.log(
      `All ${routes.length} web page routes are classified by productionReadyPaths.`,
    );
    return;
  }

  console.error(formatViolations(violations));
  process.exitCode = 1;
}

export function collectPageRoutes({ appDir, repoRoot = "" }) {
  if (!fs.existsSync(appDir)) {
    throw new Error(`App directory does not exist: ${appDir}`);
  }

  return walkPageFiles(appDir).map(filePath => ({
    filePath: repoRoot ? path.relative(repoRoot, filePath) : filePath,
    routePath: routePathFromPageFile(filePath, appDir),
  }));
}

export function routePathFromPageFile(filePath, appDir) {
  const relativeDirectory = path.dirname(path.relative(appDir, filePath));
  const segments =
    relativeDirectory === "." ? [] : relativeDirectory.split(path.sep);
  const routeSegments = segments
    .filter(segment => !isRouteGroupSegment(segment))
    .filter(segment => !isParallelRouteSegment(segment));

  return routeSegments.length === 0 ? "/" : `/${routeSegments.join("/")}`;
}

export function parseProductionReadyPaths(sourceText) {
  const sourceFile = ts.createSourceFile(
    "paths.ts",
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const initializer = findProductionReadyPathsInitializer(sourceFile);

  if (!initializer) {
    throw new Error("Could not find productionReadyPaths object literal.");
  }

  return {
    exact: readStringArrayProperty(initializer, "exact"),
    startsWith: readStringArrayProperty(initializer, "startsWith"),
    exclude: readStringArrayProperty(initializer, "exclude"),
  };
}

export function findPageAllowlistViolations({ allowlist, routes }) {
  return routes
    .filter(route => !isRouteClassified(route.routePath, allowlist))
    .map(route => ({
      filePath: route.filePath,
      routePath: route.routePath,
    }));
}

function walkPageFiles(directory) {
  const entries = fs
    .readdirSync(directory, { withFileTypes: true })
    .sort((left, right) => left.name.localeCompare(right.name));
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...walkPageFiles(entryPath));
      continue;
    }

    if (entry.isFile() && entry.name === "page.tsx") {
      files.push(entryPath);
    }
  }

  return files;
}

function isRouteGroupSegment(segment) {
  return /^\(.+\)$/u.test(segment);
}

function isParallelRouteSegment(segment) {
  return segment.startsWith("@");
}

function findProductionReadyPathsInitializer(sourceFile) {
  let initializer = null;

  function visit(node) {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === "productionReadyPaths" &&
      node.initializer &&
      ts.isObjectLiteralExpression(node.initializer)
    ) {
      initializer = node.initializer;
      return;
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return initializer;
}

function readStringArrayProperty(objectLiteral, propertyName) {
  const property = objectLiteral.properties.find(
    item =>
      ts.isPropertyAssignment(item) &&
      propertyNameText(item.name) === propertyName,
  );

  if (!property || !ts.isArrayLiteralExpression(property.initializer)) {
    throw new Error(
      `productionReadyPaths.${propertyName} must be a static string array.`,
    );
  }

  return property.initializer.elements.map(element => {
    if (
      !ts.isStringLiteral(element) &&
      !ts.isNoSubstitutionTemplateLiteral(element)
    ) {
      throw new Error(
        `productionReadyPaths.${propertyName} must contain only string literals.`,
      );
    }

    return element.text;
  });
}

function propertyNameText(name) {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name)) {
    return name.text;
  }

  return "";
}

function isRouteClassified(routePath, allowlist) {
  return (
    allowlist.exclude.includes(routePath) ||
    allowlist.exact.includes(routePath) ||
    allowlist.startsWith.some(prefix => routePath.startsWith(prefix))
  );
}

function formatViolations(violations) {
  const lines = [
    "Web page allowlist guard failed.",
    "",
    "Every packages/web/src/app/**/page.tsx route must be classified in productionReadyPaths.",
    "Add a production route to exact/startsWith, or add an intentionally dev-only route to exclude.",
    "",
    "Unclassified routes:",
  ];

  for (const violation of violations) {
    lines.push(`- ${violation.routePath}`);
    lines.push(`  file: ${violation.filePath}`);
  }

  return lines.join("\n");
}

function parseArgs(argv) {
  const args = {
    appDir: DEFAULT_APP_DIR,
    help: false,
    pathsFile: DEFAULT_PATHS_FILE,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "-h" || arg === "--help") {
      args.help = true;
      continue;
    }

    if (arg === "--app-dir") {
      args.appDir = readValue(argv, index, arg);
      index += 1;
      continue;
    }

    if (arg === "--paths-file") {
      args.pathsFile = readValue(argv, index, arg);
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
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
  console.log(`Usage: pnpm web-page-allowlist:check [options]

Options:
  --app-dir <path>     Next app directory (default: ${DEFAULT_APP_DIR})
  --paths-file <path>  File exporting productionReadyPaths (default: ${DEFAULT_PATHS_FILE})
  -h, --help           Show this help message
`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main();
}
