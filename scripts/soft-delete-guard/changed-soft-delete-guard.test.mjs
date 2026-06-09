import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  findChangedSoftDeleteViolations,
  parseChangedFileLineMap,
} from "./changed-soft-delete-guard.mjs";

const SOURCE_PATH = "packages/api/src/feature/example.repository.ts";
const SCHEMA_PATH = "packages/api/prisma/schema.prisma";

test("fails when a changed soft-delete model read has no explicit deletedAt intent", () => {
  const workspace = makeGitWorkspace();
  writeSchema(workspace);
  writeSource(
    workspace,
    `
export class ActivityRepository {
  async list() {
    return [];
  }
}
`,
  );
  commitAll(workspace, "base");

  writeSource(
    workspace,
    `
export class ActivityRepository {
  async list(clubId) {
    return this.txHost.tx.activity.findMany({
      where: { clubId },
    });
  }
}
`,
  );

  const violations = runGuard(workspace);

  assert.equal(violations.length, 1);
  assert.equal(violations[0].kind, "missing-soft-delete-intent");
  assert.equal(violations[0].detected, "this.txHost.tx.activity.findMany");
});

test("passes when a changed soft-delete model read uses activeOnly", () => {
  const workspace = makeGitWorkspace();
  writeSchema(workspace);
  writeSource(
    workspace,
    `
export class ActivityRepository {
  async list() {
    return [];
  }
}
`,
  );
  commitAll(workspace, "base");

  writeSource(
    workspace,
    `
export class ActivityRepository {
  async list(clubId) {
    return this.txHost.tx.activity.findMany({
      where: activeOnly({ clubId }),
    });
  }
}
`,
  );

  assert.deepEqual(runGuard(workspace), []);
});

test("passes when deleted records are explicitly included", () => {
  const workspace = makeGitWorkspace();
  writeSchema(workspace);
  writeSource(
    workspace,
    `
export class ActivityRepository {
  async list() {
    return [];
  }
}
`,
  );
  commitAll(workspace, "base");

  writeSource(
    workspace,
    `
export class ActivityRepository {
  async list(clubId) {
    return this.txHost.tx.activity.findMany({
      where: withDeleted({ clubId }),
    });
  }
}
`,
  );

  assert.deepEqual(runGuard(workspace), []);
});

test("passes when deleted records are explicitly selected", () => {
  const workspace = makeGitWorkspace();
  writeSchema(workspace);
  writeSource(
    workspace,
    `
export class ActivityRepository {
  async list() {
    return [];
  }
}
`,
  );
  commitAll(workspace, "base");

  writeSource(
    workspace,
    `
export class ActivityRepository {
  async list(clubId) {
    return this.txHost.tx.activity.findMany({
      where: onlyDeleted({ clubId }),
    });
  }
}
`,
  );

  assert.deepEqual(runGuard(workspace), []);
});

test("passes when a where object explicitly contains deletedAt", () => {
  const workspace = makeGitWorkspace();
  writeSchema(workspace);
  writeSource(
    workspace,
    `
export class ActivityRepository {
  async list() {
    return [];
  }
}
`,
  );
  commitAll(workspace, "base");

  writeSource(
    workspace,
    `
export class ActivityRepository {
  async list(clubId) {
    return this.txHost.tx.activity.findMany({
      where: { clubId, deletedAt: null },
    });
  }
}
`,
  );

  assert.deepEqual(runGuard(workspace), []);
});

test("fails when findUnique is used on a soft-delete model without explicit include-deleted intent", () => {
  const workspace = makeGitWorkspace();
  writeSchema(workspace);
  writeSource(
    workspace,
    `
export class ActivityRepository {
  async get() {
    return null;
  }
}
`,
  );
  commitAll(workspace, "base");

  writeSource(
    workspace,
    `
export class ActivityRepository {
  async get(id) {
    return this.txHost.tx.activity.findUnique({
      where: { id },
    });
  }
}
`,
  );

  const violations = runGuard(workspace);

  assert.equal(violations.length, 1);
  assert.equal(violations[0].kind, "ambiguous-find-unique");
});

test("passes when findUnique uses withDeleted explicitly", () => {
  const workspace = makeGitWorkspace();
  writeSchema(workspace);
  writeSource(
    workspace,
    `
export class ActivityRepository {
  async get() {
    return null;
  }
}
`,
  );
  commitAll(workspace, "base");

  writeSource(
    workspace,
    `
export class ActivityRepository {
  async get(id) {
    return this.txHost.tx.activity.findUnique({
      where: withDeleted({ id }),
    });
  }
}
`,
  );

  assert.deepEqual(runGuard(workspace), []);
});

test("fails when hard delete is used on a soft-delete model", () => {
  const workspace = makeGitWorkspace();
  writeSchema(workspace);
  writeSource(
    workspace,
    `
export class ActivityRepository {
  async remove() {
    return true;
  }
}
`,
  );
  commitAll(workspace, "base");

  writeSource(
    workspace,
    `
export class ActivityRepository {
  async remove(id) {
    return this.txHost.tx.activity.deleteMany({
      where: activeOnly({ id }),
    });
  }
}
`,
  );

  const violations = runGuard(workspace);

  assert.equal(violations.length, 1);
  assert.equal(violations[0].kind, "hard-delete-soft-delete-model");
});

test("fails when a changed tx alias query has no explicit deletedAt intent", () => {
  const workspace = makeGitWorkspace();
  writeSchema(workspace);
  writeSource(
    workspace,
    `
export class ActivityRepository {
  async list() {
    return [];
  }
}
`,
  );
  commitAll(workspace, "base");

  writeSource(
    workspace,
    `
export class ActivityRepository {
  async list(clubId) {
    const tx = this.txHost.tx;

    return tx.activity.findMany({
      where: { clubId },
    });
  }
}
`,
  );

  const violations = runGuard(workspace);

  assert.equal(violations.length, 1);
  assert.equal(violations[0].detected, "tx.activity.findMany");
});

test("passes when non soft-delete model queries omit deletedAt", () => {
  const workspace = makeGitWorkspace();
  writeSchema(workspace);
  writeSource(
    workspace,
    `
export class FileRepository {
  async list() {
    return [];
  }
}
`,
  );
  commitAll(workspace, "base");

  writeSource(
    workspace,
    `
export class FileRepository {
  async list(id) {
    return this.prisma.file.findMany({
      where: { id },
    });
  }
}
`,
  );

  assert.deepEqual(runGuard(workspace), []);
});

test("passes when untouched legacy soft-delete omissions remain", () => {
  const workspace = makeGitWorkspace();
  writeSchema(workspace);
  writeSource(
    workspace,
    `
export class ActivityRepository {
  async list(clubId) {
    return this.txHost.tx.activity.findMany({
      where: { clubId },
    });
  }
}
`,
  );
  commitAll(workspace, "base");

  writeSource(
    workspace,
    `
export class ActivityRepository {
  async list(clubId) {
    return this.txHost.tx.activity.findMany({
      where: { clubId },
    });
  }

  label() {
    return "activity";
  }
}
`,
  );

  assert.deepEqual(runGuard(workspace), []);
});

function runGuard(workspace) {
  const diff = execFileSync(
    "git",
    ["diff", "--unified=0", "--no-color", "--diff-filter=ACMR", "HEAD", "--"],
    { cwd: workspace, encoding: "utf8" },
  );

  return findChangedSoftDeleteViolations({
    changedFiles: parseChangedFileLineMap(diff),
    repoRoot: workspace,
  });
}

function makeGitWorkspace() {
  const workspace = fs.mkdtempSync(
    path.join(os.tmpdir(), "soft-delete-guard-"),
  );

  execFileSync("git", ["init"], { cwd: workspace, stdio: "ignore" });
  execFileSync("git", ["config", "user.email", "test@example.com"], {
    cwd: workspace,
  });
  execFileSync("git", ["config", "user.name", "Test User"], {
    cwd: workspace,
  });

  return workspace;
}

function writeSchema(workspace) {
  writeFile(
    workspace,
    SCHEMA_PATH,
    `
model Activity {
  id        Int       @id @default(autoincrement())
  clubId    Int
  deletedAt DateTime?
}

model File {
  id String @id
}
`,
  );
}

function writeSource(workspace, sourceText) {
  writeFile(workspace, SOURCE_PATH, sourceText);
}

function writeFile(workspace, filePath, sourceText) {
  const absolutePath = path.join(workspace, filePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, sourceText.trimStart());
}

function commitAll(workspace, message) {
  execFileSync("git", ["add", "."], { cwd: workspace });
  execFileSync("git", ["commit", "-m", message], {
    cwd: workspace,
    stdio: "ignore",
  });
}
