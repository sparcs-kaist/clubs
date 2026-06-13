#!/usr/bin/env node

import { spawn } from "node:child_process";

export const DEFAULT_GROUPS = [
  {
    name: "quick checks",
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
  },
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

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = await runPrePushGroups();
  process.exitCode = result.exitCode;
}
