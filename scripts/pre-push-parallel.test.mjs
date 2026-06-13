import assert from "node:assert/strict";
import test from "node:test";

import { runPrePushGroups, selectPrePushGroups } from "./pre-push-parallel.mjs";

test("parallel groups run every task before skipping later groups on failure", async () => {
  const events = [];
  const output = [];
  const groups = [
    {
      name: "read-only checks",
      mode: "parallel",
      tasks: [
        { name: "format", command: "pnpm", args: ["format:check:changed"] },
        {
          name: "soft-delete",
          command: "pnpm",
          args: ["soft-delete-guard:changed"],
        },
      ],
    },
    {
      name: "runtime evidence checks",
      mode: "serial",
      tasks: [{ name: "mcdc", command: "pnpm", args: ["mcdc:changed"] }],
    },
  ];

  const completions = new Map();
  const runPromise = runPrePushGroups(groups, {
    runTask: task => {
      events.push(`start:${task.name}`);

      return new Promise(resolve => {
        completions.set(task.name, () => {
          events.push(`end:${task.name}`);
          resolve({
            task,
            status: task.name === "soft-delete" ? 1 : 0,
            durationMs: task.name === "soft-delete" ? 21 : 13,
            stdout: task.name === "format" ? "format ok\n" : "",
            stderr: task.name === "soft-delete" ? "soft-delete failed\n" : "",
          });
        });
      });
    },
    stdout: { write: chunk => output.push(chunk) },
    stderr: { write: chunk => output.push(chunk) },
  });

  await new Promise(resolve => {
    setImmediate(resolve);
  });

  assert.deepEqual(events, ["start:format", "start:soft-delete"]);
  completions.get("soft-delete")();
  completions.get("format")();

  const result = await runPromise;

  assert.equal(result.exitCode, 1);
  assert.deepEqual(events, [
    "start:format",
    "start:soft-delete",
    "end:soft-delete",
    "end:format",
  ]);
  assert.equal(result.skippedGroups[0].name, "runtime evidence checks");
  assert.match(output.join(""), /soft-delete failed/u);
});

test("serial groups run tasks in order after earlier parallel groups pass", async () => {
  const events = [];
  const groups = [
    {
      name: "quick checks",
      mode: "parallel",
      tasks: [
        { name: "format", command: "pnpm", args: ["format:check:changed"] },
        { name: "lint", command: "pnpm", args: ["lint"] },
      ],
    },
    {
      name: "runtime evidence checks",
      mode: "serial",
      tasks: [
        { name: "mcdc", command: "pnpm", args: ["mcdc:changed"] },
        { name: "final", command: "pnpm", args: ["final-check"] },
      ],
    },
  ];

  const result = await runPrePushGroups(groups, {
    runTask: async task => {
      events.push(task.name);

      return {
        task,
        status: 0,
        durationMs: 1,
        stdout: "",
        stderr: "",
      };
    },
    stdout: { write() {} },
    stderr: { write() {} },
  });

  assert.equal(result.exitCode, 0);
  assert.deepEqual(events.slice(0, 2).sort(), ["format", "lint"]);
  assert.deepEqual(events.slice(2), ["mcdc", "final"]);
  assert.deepEqual(result.skippedGroups, []);
});

test("diff-line convention guard profile runs only changed-line migration guards", () => {
  const groups = selectPrePushGroups([
    "--profile",
    "diff-line-convention-guards",
  ]);

  assert.deepEqual(
    groups.map(group => group.name),
    ["diff-line convention guards"],
  );
  assert.deepEqual(
    groups.flatMap(group => group.tasks.map(task => task.name)),
    [
      "base-repository-guard:changed",
      "prisma-query:changed",
      "repository-domain-guard:changed",
      "soft-delete-guard:changed",
      "transaction-guard:changed",
    ],
  );
});

test("pre-push profile keeps MC/DC in a separate runtime evidence group", () => {
  const groups = selectPrePushGroups(["--profile", "pre-push"]);

  assert.deepEqual(
    groups.map(group => group.name),
    [
      "static checks",
      "diff-line convention guards",
      "lint",
      "runtime evidence checks",
    ],
  );
  assert.deepEqual(
    groups.at(-1).tasks.map(task => task.name),
    ["mcdc:changed --fail-on-missing"],
  );
});
