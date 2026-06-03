#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

import {
  buildRepositoryCommandIndex,
  findTransactionGuardNodes,
} from "./transaction-detector.mjs";

const DEFAULT_SOURCE = "packages/api/src";

function main() {
  const args = parseArgs(process.argv.slice(2));
  const repoRoot = process.cwd();
  const sources = readProductionSources(repoRoot, args.sources);
  const repositoryCommandIndex = buildRepositoryCommandIndex(
    sources.filter(source =>
      toPosixPath(source.filePath).includes("/repository/"),
    ),
  );
  const violations = [];

  for (const source of sources) {
    const result = findTransactionGuardNodes({
      sourceText: source.sourceText,
      filePath: source.filePath,
      repositoryCommandIndex,
    });

    if (result.parseError) {
      violations.push({
        filePath: source.filePath,
        line: result.parseError.line,
        column: result.parseError.column,
        kind: "parse-error",
        detected: "TypeScript parse error",
        reason: result.parseError.message,
      });
      continue;
    }

    for (const node of result.nodes) {
      violations.push({
        filePath: source.filePath,
        line: node.line,
        column: node.column,
        kind: node.kind,
        detected: node.detected,
        reason: node.reason,
      });
    }
  }

  if (violations.length === 0) {
    console.log("No transaction migration guard violations found.");
    return;
  }

  console.log(formatViolations(violations));

  if (args.fail) {
    process.exitCode = 1;
  }
}

function readProductionSources(repoRoot, sourcePaths) {
  return sourcePaths
    .flatMap(sourcePath => walkFiles(path.resolve(repoRoot, sourcePath)))
    .map(filePath => path.relative(repoRoot, filePath))
    .filter(filePath => isApiProductionTypeScriptFile(filePath))
    .map(filePath => ({
      filePath,
      sourceText: fs.readFileSync(path.resolve(repoRoot, filePath), "utf8"),
    }));
}

function walkFiles(targetPath) {
  if (!fs.existsSync(targetPath)) {
    return [];
  }

  const stat = fs.statSync(targetPath);
  if (stat.isFile()) {
    return [targetPath];
  }

  return fs.readdirSync(targetPath, { withFileTypes: true }).flatMap(entry => {
    const fullPath = path.join(targetPath, entry.name);
    return entry.isDirectory() ? walkFiles(fullPath) : [fullPath];
  });
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
    "Transaction migration guard report.",
    "This command is report-only unless --fail is passed.",
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
    fail: false,
    sources: [],
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--fail") {
      args.fail = true;
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
  console.log(`Usage: pnpm transaction-guard:all [options]

Options:
  --fail            Exit non-zero when violations are found
  --source <path>   Source path to inspect (default: packages/api/src)
  -h, --help        Show this help message
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
