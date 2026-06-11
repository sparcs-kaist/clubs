import assert from "node:assert/strict";
import { existsSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const SCRIPT_PATH = resolve("scripts/run-with-test-database-url.mjs");

test("run-with-test-database-url rejects non-test DATABASE_URL before running the command", () => {
  const workspace = mkdtempSync(join(tmpdir(), "clubs-db-url-guard-"));
  const markerPath = join(workspace, "command-ran");
  const result = spawnSync(
    process.execPath,
    [
      SCRIPT_PATH,
      process.execPath,
      "-e",
      `require("node:fs").writeFileSync(${JSON.stringify(markerPath)}, "")`,
    ],
    {
      cwd: workspace,
      encoding: "utf8",
      env: {
        ...process.env,
        DATABASE_URL:
          "mysql://root:password@clubs.stage.inet.sparcs.net:32715/db",
      },
    },
  );

  assert.notEqual(result.status, 0);
  assert.equal(existsSync(markerPath), false);
  assert.match(result.stderr, /test database/i);
  assert.doesNotMatch(result.stderr, /clubs\.stage\.inet\.sparcs\.net/);
  assert.doesNotMatch(result.stderr, /32715/);
});

test("run-with-test-database-url runs the command for a test DATABASE_URL", () => {
  const workspace = mkdtempSync(join(tmpdir(), "clubs-db-url-guard-"));
  const markerPath = join(workspace, "command-ran");
  const result = spawnSync(
    process.execPath,
    [
      SCRIPT_PATH,
      process.execPath,
      "-e",
      `require("node:fs").writeFileSync(${JSON.stringify(markerPath)}, "")`,
    ],
    {
      cwd: workspace,
      encoding: "utf8",
      env: {
        ...process.env,
        DATABASE_URL:
          "mysql://root:test_password_123@127.0.0.1:3307/clubs_test",
      },
    },
  );

  assert.equal(result.status, 0, result.stderr);
  assert.equal(existsSync(markerPath), true);
});
