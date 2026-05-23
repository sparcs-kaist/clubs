#!/usr/bin/env node

import {
  analyzeSourcePaths,
  buildReport,
  collectEvidence,
  formatTextReport,
} from "./analyzer.mjs";

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    console.log(helpText());
    return;
  }

  if (args.sources.length === 0) {
    console.error("At least one --source path is required.");
    console.error("");
    console.error(helpText());
    process.exitCode = 2;
    return;
  }

  const decisions = analyzeSourcePaths(args.sources, {
    minConditions: args.minConditions,
    rootDir: process.cwd(),
  });
  const evidence = collectEvidence([...args.tests, ...args.evidence], {
    rootDir: process.cwd(),
  });
  const report = buildReport(decisions, evidence);

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
    evidence: [],
    failOnMissing: false,
    format: "text",
    help: false,
    minConditions: 1,
    sources: [],
    tests: [],
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--") {
      continue;
    } else if (arg === "--help" || arg === "-h") {
      args.help = true;
    } else if (arg === "--source" || arg === "-s") {
      args.sources.push(readValue(argv, index, arg));
      index += 1;
    } else if (arg === "--tests" || arg === "-t") {
      args.tests.push(readValue(argv, index, arg));
      index += 1;
    } else if (arg === "--evidence" || arg === "-e") {
      args.evidence.push(readValue(argv, index, arg));
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

  if (!["json", "text"].includes(args.format)) {
    throw new Error("--format must be either text or json.");
  }

  if (!Number.isInteger(args.minConditions) || args.minConditions < 1) {
    throw new Error("--min-conditions must be a positive integer.");
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

function helpText() {
  return `Usage: pnpm mcdc --source <path> [options]

Options:
  -s, --source <path>       Source file or directory to inspect. Repeatable.
  -t, --tests <path>        Test file or directory containing @mcdc evidence.
  -e, --evidence <path>     JSON evidence file or directory. Repeatable.
      --format <text|json>  Output format. Default: text.
      --min-conditions <n>  Minimum atomic condition count to report. Default: 1.
      --fail-on-missing     Exit with code 1 when any condition lacks MC/DC evidence.
  -h, --help                Show this help.

Evidence comment format:
  /*
   * @mcdc
   * decision: packages/api/src/foo.ts:10:7:abcd1234
   * case: C1=true, C2=true => true
   * case: C1=false, C2=true => false
   */

JSON evidence format:
  {
    "decisions": {
      "packages/api/src/foo.ts:10:7:abcd1234": [
        { "name": "happy path", "conditions": { "C1": true }, "outcome": true }
      ]
    }
  }`;
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 2;
}
