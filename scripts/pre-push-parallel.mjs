#!/usr/bin/env node

import { spawn } from "node:child_process";

const profileNames = new Set(["pre-push", "diff-line-convention-guards"]);

export const DIFF_LINE_CONVENTION_GUARD_GROUP = {
  name: "diff-line convention guards",
  mode: "parallel",
  tasks: [
    {
      name: "base-repository-guard:changed",
      command: "pnpm",
      args: ["base-repository-guard:changed"],
    },
    {
      name: "prisma-query:changed",
      command: "pnpm",
      args: ["prisma-query:changed"],
    },
    {
      name: "repository-domain-guard:changed",
      command: "pnpm",
      args: ["repository-domain-guard:changed"],
    },
    {
      name: "soft-delete-guard:changed",
      command: "pnpm",
      args: ["soft-delete-guard:changed"],
    },
    {
      name: "transaction-guard:changed",
      command: "pnpm",
      args: ["transaction-guard:changed"],
    },
  ],
};

export const DEFAULT_GROUPS = [
  {
    name: "static checks",
    mode: "parallel",
    tasks: [
      {
        name: "format:check:changed",
        command: "pnpm",
        args: ["format:check:changed"],
      },
      {
        name: "web-page-allowlist:check",
        command: "pnpm",
        args: ["web-page-allowlist:check"],
      },
    ],
  },
  DIFF_LINE_CONVENTION_GUARD_GROUP,
  {
    name: "lint",
    mode: "serial",
    tasks: [{ name: "lint", command: "pnpm", args: ["lint"] }],
  },
  {
    name: "runtime evidence checks",
    mode: "serial",
    tasks: [
      {
        name: "mcdc:changed --fail-on-missing",
        command: "pnpm",
        args: ["mcdc:changed", "--fail-on-missing"],
      },
    ],
  },
];

export function selectPrePushGroups(argv = []) {
  const args = parseArgs(argv);

  if (args.profile === "diff-line-convention-guards") {
    return [DIFF_LINE_CONVENTION_GUARD_GROUP];
  }

  return DEFAULT_GROUPS;
}

function parseArgs(argv) {
  const args = {
    profile: "pre-push",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--profile") {
      args.profile = readValue(argv, index, arg);
      index += 1;
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!profileNames.has(args.profile)) {
    throw new Error(
      `Unknown profile: ${args.profile}. Expected one of ${[
        ...profileNames,
      ].join(", ")}.`,
    );
  }

  return args;
}

export async function runPrePushGroups(
  groups = DEFAULT_GROUPS,
  {
    runTask = runCommandTask,
    stdout = process.stdout,
    stderr = process.stderr,
  } = {},
) {
  const completedGroups = [];
  const skippedGroups = [];

  for (let groupIndex = 0; groupIndex < groups.length; groupIndex += 1) {
    const group = groups[groupIndex];
    stdout.write(`\n== ${group.name} (${group.mode}) ==\n`);

    const results =
      group.mode === "parallel"
        ? await Promise.all(group.tasks.map(task => runTask(task)))
        : await runTasksSerially(group.tasks, runTask);

    completedGroups.push({ group, results });
    writeGroupSummary(results, stdout);

    const failures = results.filter(result => result.status !== 0);

    if (failures.length > 0) {
      writeFailureDetails(failures, stderr);
      skippedGroups.push(...groups.slice(groupIndex + 1));

      for (const skippedGroup of skippedGroups) {
        stdout.write(`SKIP ${skippedGroup.name}\n`);
      }

      return {
        completedGroups,
        exitCode: 1,
        skippedGroups,
      };
    }
  }

  return {
    completedGroups,
    exitCode: 0,
    skippedGroups,
  };
}

async function runTasksSerially(tasks, runTask) {
  const results = [];

  for (const task of tasks) {
    results.push(await runTask(task));
  }

  return results;
}

export function runCommandTask(task) {
  const startTime = process.hrtime.bigint();

  return new Promise(resolve => {
    const child = spawn(task.command, task.args, {
      cwd: task.cwd ?? process.cwd(),
      env: { ...process.env, ...task.env },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let settled = false;

    child.stdout.on("data", chunk => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", chunk => {
      stderr += chunk.toString();
    });

    child.on("error", error => {
      if (settled) {
        return;
      }

      settled = true;
      resolve({
        durationMs: elapsedMs(startTime),
        error,
        signal: null,
        status: 1,
        stderr: `${stderr}${error.message}\n`,
        stdout,
        task,
      });
    });

    child.on("close", (status, signal) => {
      if (settled) {
        return;
      }

      settled = true;
      resolve({
        durationMs: elapsedMs(startTime),
        signal,
        status: status ?? 1,
        stderr,
        stdout,
        task,
      });
    });
  });
}

function writeGroupSummary(results, stdout) {
  for (const result of results) {
    const label = result.status === 0 ? "PASS" : "FAIL";
    stdout.write(
      `${label} ${result.task.name} ${formatDuration(result.durationMs)}\n`,
    );
  }
}

function writeFailureDetails(failures, stderr) {
  stderr.write("\nPre-push checks failed.\n");

  for (const failure of failures) {
    stderr.write(`\n--- ${failure.task.name} ---\n`);

    if (failure.stdout) {
      stderr.write(failure.stdout);
      if (!failure.stdout.endsWith("\n")) {
        stderr.write("\n");
      }
    }

    if (failure.stderr) {
      stderr.write(failure.stderr);
      if (!failure.stderr.endsWith("\n")) {
        stderr.write("\n");
      }
    }

    if (!failure.stdout && !failure.stderr) {
      stderr.write(
        `Command exited with status ${failure.status}${formatSignal(
          failure.signal,
        )}.\n`,
      );
    }
  }
}

function elapsedMs(startTime) {
  return Number(process.hrtime.bigint() - startTime) / 1_000_000;
}

function formatDuration(durationMs) {
  return `${(durationMs / 1000).toFixed(2)}s`;
}

function formatSignal(signal) {
  return signal ? ` (${signal})` : "";
}

function readValue(argv, index, arg) {
  const value = argv[index + 1];

  if (!value || value.startsWith("-")) {
    throw new Error(`${arg} requires a value.`);
  }

  return value;
}

function printHelp() {
  console.log(`Usage: pnpm pre-push:parallel [options]

Options:
  --profile <name>  pre-push | diff-line-convention-guards (default: pre-push)
  -h, --help        Show this help message
`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const result = await runPrePushGroups(
      selectPrePushGroups(process.argv.slice(2)),
    );
    process.exitCode = result.exitCode;
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 2;
  }
}
