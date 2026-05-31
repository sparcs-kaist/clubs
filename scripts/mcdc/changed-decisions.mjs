import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import {
  analyzeSourceFile,
  analyzeSourceText,
  isSourceFilePath,
} from "./analyzer.mjs";

export function getChangedSourceFiles({
  baseRef,
  repoRoot = process.cwd(),
  sourceFilters = [],
}) {
  const args = ["diff", "--name-only", "--diff-filter=ACMRT", baseRef, "--"];

  if (sourceFilters.length > 0) {
    args.push(...sourceFilters);
  }

  const output = execFileSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
  });

  return output
    .split("\n")
    .map(line => line.trim())
    .filter(Boolean)
    .filter(isSourceFilePath)
    .filter(filePath => !isTestFilePath(filePath))
    .filter(filePath => fs.existsSync(path.resolve(repoRoot, filePath)))
    .sort();
}

export function analyzeChangedDecisions({
  baseRef,
  repoRoot = process.cwd(),
  sourcePaths = [],
  minConditions = 1,
}) {
  const sourceFilters = sourcePaths.map(sourcePath =>
    normalizePath(path.relative(repoRoot, path.resolve(repoRoot, sourcePath))),
  );
  const changedSourcePaths = getChangedSourceFiles({
    baseRef,
    repoRoot,
    sourceFilters,
  });

  const decisions = changedSourcePaths.flatMap(sourcePath => {
    const absolutePath = path.resolve(repoRoot, sourcePath);
    const currentDecisions = analyzeSourceFile(absolutePath, {
      rootDir: repoRoot,
      minConditions,
    });
    const baseDecisions = analyzeBaseSourceFile({
      baseRef,
      repoRoot,
      sourcePath,
      minConditions,
    });

    return filterChangedDecisions(currentDecisions, baseDecisions);
  });

  return {
    changedSourcePaths,
    decisions,
  };
}

export function filterChangedDecisions(currentDecisions, baseDecisions) {
  const baseStableKeys = new Set(
    baseDecisions.map(decision => decision.stableKey),
  );

  return currentDecisions.filter(
    decision => !baseStableKeys.has(decision.stableKey),
  );
}

function analyzeBaseSourceFile({
  baseRef,
  repoRoot,
  sourcePath,
  minConditions,
}) {
  const sourceText = readFileAtRef(baseRef, sourcePath, repoRoot);

  if (sourceText === null) {
    return [];
  }

  return analyzeSourceText(sourceText, path.resolve(repoRoot, sourcePath), {
    rootDir: repoRoot,
    minConditions,
  });
}

function readFileAtRef(ref, filePath, cwd) {
  try {
    return execFileSync("git", ["show", `${ref}:${filePath}`], {
      cwd,
      encoding: "utf8",
      maxBuffer: 20 * 1024 * 1024,
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch {
    return null;
  }
}

function normalizePath(filePath) {
  return filePath.split(path.sep).join(path.posix.sep);
}

function isTestFilePath(filePath) {
  return /\.(?:spec|test)\.[cm]?[tj]sx?$/u.test(filePath);
}
