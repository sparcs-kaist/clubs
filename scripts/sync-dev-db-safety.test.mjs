import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import test from "node:test";

const SCRIPT_PATH = resolve("scripts/sync-dev-db.mjs");

test("sync-dev-db rejects DATABASE_URL when it is not a test database", () => {
  const workspace = makeWorkspace({
    databaseUrl: "mysql://root:password@clubs.stage.inet.sparcs.net:32715/db",
  });

  const result = spawnSync(
    process.execPath,
    [SCRIPT_PATH, "--dry-run", "db_dumps/prod.sql"],
    {
      cwd: workspace,
      encoding: "utf8",
    },
  );

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /test database/i);
  assert.doesNotMatch(result.stderr, /clubs\.stage\.inet\.sparcs\.net/);
  assert.doesNotMatch(result.stderr, /32715/);
});

test("sync-dev-db allows DATABASE_URL when it points to a local test database", () => {
  const workspace = makeWorkspace({
    databaseUrl: "mysql://root:test_password_123@127.0.0.1:3307/clubs_test",
  });

  assert.doesNotThrow(() => {
    execFileSync(
      process.execPath,
      [SCRIPT_PATH, "--dry-run", "db_dumps/prod.sql"],
      {
        cwd: workspace,
        encoding: "utf8",
        stdio: "pipe",
      },
    );
  });
});

function makeWorkspace({ databaseUrl }) {
  const workspace = mkdtempSync(join(tmpdir(), "clubs-sync-dev-db-"));

  writeFile(join(workspace, ".env"), `DATABASE_URL=${databaseUrl}\n`);
  writeFile(join(workspace, "db_dumps", "prod.sql"), "");

  return workspace;
}

function writeFile(path, content) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
}
