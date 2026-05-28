#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

import {
  analyzeSourcePaths,
  buildReport,
  collectEvidence,
  formatTextReport,
} from "./analyzer.mjs";
import { analyzeChangedDecisions } from "./changed-decisions.mjs";

function main() {
  const args = parseArgs(process.argv.slice(2));
  const repoRoot = process.cwd();
  const jestCwd = path.resolve(repoRoot, args.jestCwd);
  const selection = selectDecisions(args, repoRoot);
  const sourcePaths = selection.sourcePaths.map(sourcePath =>
    path.resolve(repoRoot, sourcePath),
  );

  if (selection.decisions.length === 0) {
    console.log(
      args.changedFrom
        ? `No changed MC/DC decisions relative to ${args.changedFrom}.`
        : "No MC/DC decisions found.",
    );
    return;
  }

  const evidenceDir = path.resolve(repoRoot, ".mcdc/runtime");

  fs.rmSync(evidenceDir, { recursive: true, force: true });
  fs.mkdirSync(evidenceDir, { recursive: true });

  const jestArgs = ["exec", "jest", "--config", args.jestConfig, "--runInBand"];

  if (args.tests.length > 0) {
    jestArgs.push(
      "--runTestsByPath",
      ...args.tests.map(testPath =>
        path.relative(jestCwd, path.resolve(repoRoot, testPath)),
      ),
    );
  }

  const result = spawnSync("pnpm", jestArgs, {
    cwd: jestCwd,
    env: {
      ...process.env,
      MCDC_EVIDENCE_DIR: evidenceDir,
      MCDC_REPO_ROOT: repoRoot,
      MCDC_SOURCE_PATHS: JSON.stringify(sourcePaths),
    },
    stdio: "inherit",
  });

  if (result.status !== 0) {
    process.exitCode = result.status ?? 1;
    return;
  }

  const evidence = collectEvidence([evidenceDir], { rootDir: repoRoot });
  const report = buildReport(selection.decisions, evidence);

  if (args.format === "json") {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(formatTextReport(report));
  }

  if (args.failOnMissing && report.summary.missingConditions > 0) {
    process.exitCode = 1;
  }
}

function parseArgs(argv) {
  const args = {
    failOnMissing: false,
    format: "text",
    jestConfig: "test/jest-mcdc.json",
    jestCwd: "packages/api",
    changedFrom: null,
    minConditions: 1,
    sources: [],
    tests: [],
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--source" || arg === "-s") {
      args.sources.push(readValue(argv, index, arg));
      index += 1;
    } else if (arg === "--test" || arg === "-t") {
      args.tests.push(readValue(argv, index, arg));
      index += 1;
    } else if (arg === "--jest-cwd") {
      args.jestCwd = readValue(argv, index, arg);
      index += 1;
    } else if (arg === "--jest-config") {
      args.jestConfig = readValue(argv, index, arg);
      index += 1;
    } else if (arg === "--changed-from") {
      args.changedFrom = readValue(argv, index, arg);
      index += 1;
    } else if (arg === "--format") {
      args.format = readValue(argv, index, arg);
      index += 1;
    } else if (arg === "--min-conditions") {
      args.minConditions = Number(readValue(argv, index, arg));
      index += 1;
    } else if (arg === "--fail-on-missing") {
      args.failOnMissing = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (args.sources.length === 0 && !args.changedFrom) {
    throw new Error("At least one --source path is required.");
  }

  if (!["json", "text"].includes(args.format)) {
    throw new Error("--format must be either text or json.");
  }

  if (!Number.isInteger(args.minConditions) || args.minConditions < 1) {
    throw new Error("--min-conditions must be a positive integer.");
  }

  return args;
}

function selectDecisions(args, repoRoot) {
  if (args.changedFrom) {
    const sourceFilters = args.sources.map(sourcePath =>
      path.relative(repoRoot, path.resolve(repoRoot, sourcePath)),
    );
    const changed = analyzeChangedDecisions({
      baseRef: args.changedFrom,
      repoRoot,
      sourcePaths: sourceFilters,
      minConditions: args.minConditions,
    });

    return {
      decisions: changed.decisions,
      sourcePaths: changed.changedSourcePaths,
    };
  }

  return {
    decisions: analyzeSourcePaths(args.sources, {
      minConditions: args.minConditions,
      rootDir: repoRoot,
    }),
    sourcePaths: args.sources,
  };
}

function readValue(argv, index, arg) {
  const value = argv[index + 1];

  if (!value || value.startsWith("-")) {
    throw new Error(`${arg} requires a value.`);
  }

  return value;
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 2;
}
