#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import {
  buildRepositoryCommandIndex,
  findTransactionGuardNodes,
} from "./transaction-detector.mjs";

const DEFAULT_CHANGED_FROM = "origin/dev";
const DEFAULT_SOURCE = "packages/api/src";

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
  const violations = findChangedTransactionViolations({
    baseRef,
    changedFiles,
    repoRoot,
  });

  if (violations.length === 0) {
    console.log(
      `No transaction migration guard violations found relative to ${args.changedFrom}.`,
    );
    return;
  }

  console.error(formatViolations(violations));
  process.exitCode = 1;
}

export function findChangedTransactionViolations({
  changedFiles,
  repoRoot = process.cwd(),
}) {
  const repositoryCommandIndex = buildRepositoryCommandIndex(
    readRepositorySources(repoRoot),
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
    const result = findTransactionGuardNodes({
      sourceText,
      filePath: changedFile.path,
      repositoryCommandIndex,
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

  return violations.sort(
    (left, right) =>
      left.filePath.localeCompare(right.filePath) ||
      left.line - right.line ||
      left.column - right.column,
  );
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

function readRepositorySources(repoRoot) {
  const sourceRoot = path.resolve(repoRoot, DEFAULT_SOURCE);
  if (!fs.existsSync(sourceRoot)) {
    return [];
  }

  return walkFiles(sourceRoot)
    .map(filePath => path.relative(repoRoot, filePath))
    .filter(filePath => isApiProductionTypeScriptFile(filePath))
    .filter(filePath => isRepositoryIndexSourceFile(filePath))
    .map(filePath => ({
      filePath,
      sourceText: fs.readFileSync(path.resolve(repoRoot, filePath), "utf8"),
    }));
}

function isRepositoryIndexSourceFile(filePath) {
  const posixPath = toPosixPath(filePath);

  return (
    posixPath.includes("/repository/") ||
    /^packages\/api\/src\/common\/base\/[^/]*repository\.ts$/u.test(posixPath)
  );
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

function isApiProductionTypeScriptFile(filePath) {
  return (
    toPosixPath(filePath).startsWith("packages/api/src/") &&
    /\.ts$/u.test(filePath) &&
    !/\.(?:spec|test)\.ts$/u.test(filePath)
  );
}

function formatViolations(violations) {
  const lines = [
    "Transaction migration guard violations found in changed API source lines.",
    "Use @Transactional service boundaries and TransactionHost.tx-backed repositories.",
    "",
  ];

  for (const violation of violations) {
    lines.push(`${violation.filePath}:${violation.line}:${violation.column}`);
    lines.push(`  kind: ${violation.kind}`);
    lines.push(`  detected: ${violation.detected}`);
    lines.push(`  reason: ${violation.reason}`);
    lines.push("");
  }

  return lines.join("\n").trimEnd();
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
  console.log(`Usage: pnpm transaction-guard:changed [options]

Options:
  --changed-from <ref>  Base branch/ref to compare against (default: origin/dev)
  --source <path>       Source path to inspect (default: packages/api/src)
  -h, --help            Show this help message
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
