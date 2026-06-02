import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  findChangedRawSqlViolations,
  parseChangedFileLineMap,
} from "./changed-raw-sql.mjs";

const SOURCE_PATH = "packages/api/src/feature/example.repository.ts";

test("passes when a non-raw line changes in a file with existing raw SQL", () => {
  const workspace = makeGitWorkspace();
  writeSource(
    workspace,
    `
export async function list(prisma) {
  const rows = await prisma.$queryRaw(Prisma.sql\`
    SELECT *
    FROM club
  \`);

  return rows.length;
}
`,
  );
  commitAll(workspace, "base");

  writeSource(
    workspace,
    `
export async function list(prisma) {
  const rows = await prisma.$queryRaw(Prisma.sql\`
    SELECT *
    FROM club
  \`);

  return rows.length + 1;
}
`,
  );

  assert.deepEqual(runGuard(workspace), []);
});

test("fails when raw SQL is added", () => {
  const workspace = makeGitWorkspace();
  writeSource(
    workspace,
    `
export async function list(prisma) {
  return prisma.club.findMany();
}
`,
  );
  commitAll(workspace, "base");

  writeSource(
    workspace,
    `
export async function list(prisma) {
  return prisma.$queryRaw(Prisma.sql\`
    SELECT *
    FROM club
  \`);
}
`,
  );

  const violations = runGuard(workspace);

  assert.equal(violations.length, 1);
  assert.equal(violations[0].detected, "prisma.$queryRaw");
  assert.equal(
    violations[0].reason,
    "raw SQL API overlaps an added or modified line",
  );
});

test("passes when raw SQL only migrates from root prisma to txHost", () => {
  const workspace = makeGitWorkspace();
  writeSource(
    workspace,
    `
export async function list() {
  return this.prisma.$queryRaw(Prisma.sql\`
    SELECT *
    FROM club
    WHERE deleted_at IS NULL
  \`);
}
`,
  );
  commitAll(workspace, "base");

  writeSource(
    workspace,
    `
export async function list() {
  return this.txHost.tx.$queryRaw(Prisma.sql\`
    SELECT *
    FROM club
    WHERE deleted_at IS NULL
  \`);
}
`,
  );

  assert.deepEqual(runGuard(workspace), []);
});

test("fails when a duplicate raw SQL block is added", () => {
  const workspace = makeGitWorkspace();
  writeSource(
    workspace,
    `
export async function list(prisma) {
  return prisma.$queryRaw(Prisma.sql\`
    SELECT *
    FROM club
    WHERE deleted_at IS NULL
  \`);
}
`,
  );
  commitAll(workspace, "base");

  writeSource(
    workspace,
    `
export async function list(prisma) {
  return prisma.$queryRaw(Prisma.sql\`
    SELECT *
    FROM club
    WHERE deleted_at IS NULL
  \`);
}

export async function listAgain(prisma) {
  return prisma.$queryRaw(Prisma.sql\`
    SELECT *
    FROM club
    WHERE deleted_at IS NULL
  \`);
}
`,
  );

  const violations = runGuard(workspace);

  assert.equal(violations.length, 1);
  assert.equal(violations[0].detected, "prisma.$queryRaw");
  assert.equal(
    violations[0].reason,
    "raw SQL API overlaps an added or modified line",
  );
});

test("passes when a raw SQL block is removed", () => {
  const workspace = makeGitWorkspace();
  writeSource(
    workspace,
    `
export async function list(prisma) {
  return prisma.$queryRaw(Prisma.sql\`
    SELECT *
    FROM club
  \`);
}
`,
  );
  commitAll(workspace, "base");

  writeSource(
    workspace,
    `
export async function list(prisma) {
  return prisma.club.findMany();
}
`,
  );

  assert.deepEqual(runGuard(workspace), []);
});

test("fails when a deleted line edits a raw SQL block that remains", () => {
  const workspace = makeGitWorkspace();
  writeSource(
    workspace,
    `
export async function list(prisma, clubId) {
  return prisma.$queryRaw(Prisma.sql\`
    SELECT *
    FROM club
    WHERE id = \${clubId}
      AND deleted_at IS NULL
  \`);
}
`,
  );
  commitAll(workspace, "base");

  writeSource(
    workspace,
    `
export async function list(prisma, clubId) {
  return prisma.$queryRaw(Prisma.sql\`
    SELECT *
    FROM club
    WHERE id = \${clubId}
  \`);
}
`,
  );

  const violations = runGuard(workspace);

  assert.equal(violations.length, 1);
  assert.equal(violations[0].detected, "prisma.$queryRaw");
  assert.equal(
    violations[0].reason,
    "deleted line modified a raw SQL block that still remains",
  );
});

function runGuard(workspace) {
  const diff = execFileSync(
    "git",
    ["diff", "--unified=0", "--no-color", "--diff-filter=ACMR", "HEAD", "--"],
    { cwd: workspace, encoding: "utf8" },
  );

  return findChangedRawSqlViolations({
    baseRef: "HEAD",
    changedFiles: parseChangedFileLineMap(diff),
    repoRoot: workspace,
  });
}

function makeGitWorkspace() {
  const workspace = fs.mkdtempSync(
    path.join(os.tmpdir(), "prisma-query-guard-"),
  );

  fs.mkdirSync(path.dirname(path.join(workspace, SOURCE_PATH)), {
    recursive: true,
  });

  execFileSync("git", ["init"], { cwd: workspace, stdio: "ignore" });
  execFileSync("git", ["config", "user.email", "test@example.com"], {
    cwd: workspace,
  });
  execFileSync("git", ["config", "user.name", "Test User"], {
    cwd: workspace,
  });

  return workspace;
}

function writeSource(workspace, sourceText) {
  fs.writeFileSync(path.join(workspace, SOURCE_PATH), sourceText.trimStart());
}

function commitAll(workspace, message) {
  execFileSync("git", ["add", "."], { cwd: workspace });
  execFileSync("git", ["commit", "-m", message], {
    cwd: workspace,
    stdio: "ignore",
  });
}
