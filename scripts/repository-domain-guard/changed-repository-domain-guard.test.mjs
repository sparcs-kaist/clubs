import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  findChangedRepositoryDomainViolations,
  parseChangedFileLineMap,
} from "./changed-repository-domain-guard.mjs";

const SCHEMA_PATH = "packages/api/prisma/schema.prisma";
const ACTIVITY_SOURCE_PATH =
  "packages/api/src/feature/activity/repository/activity.repository.ts";
const ACTIVITY_MODULE_PATH =
  "packages/api/src/feature/activity/activity.module.ts";
const ACTIVITY_BOUNDARY_PATH =
  "packages/api/src/feature/activity/repository/repository-boundary.ts";
const CLUB_BOUNDARY_PATH =
  "packages/api/src/feature/club/repository/repository-boundary.ts";

test("passes when a changed repository queries an owned Prisma model", () => {
  const workspace = makeGitWorkspace();
  writeSchema(workspace);
  writeBoundary(workspace, ACTIVITY_BOUNDARY_PATH, ["activity"]);
  writeSource(
    workspace,
    ACTIVITY_SOURCE_PATH,
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
    ACTIVITY_SOURCE_PATH,
    `
export class ActivityRepository {
  async list() {
    return this.prisma.activity.findMany({
      where: { deletedAt: null },
    });
  }
}
`,
  );

  assert.deepEqual(runGuard(workspace), []);
});

test("fails when a changed repository queries a Prisma model outside its boundary", () => {
  const workspace = makeGitWorkspace();
  writeSchema(workspace);
  writeBoundary(workspace, ACTIVITY_BOUNDARY_PATH, ["activity"]);
  writeSource(
    workspace,
    ACTIVITY_SOURCE_PATH,
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
    ACTIVITY_SOURCE_PATH,
    `
export class ActivityRepository {
  async list() {
    return this.prisma.club.findMany();
  }
}
`,
  );

  const violations = runGuard(workspace);

  assert.equal(violations.length, 1);
  assert.equal(violations[0].kind, "cross-boundary-prisma-model");
  assert.equal(violations[0].detected, "this.prisma.club.findMany");
});

test("fails when bracket delegate access crosses the repository boundary", () => {
  const workspace = makeGitWorkspace();
  writeSchema(workspace);
  writeBoundary(workspace, ACTIVITY_BOUNDARY_PATH, ["activity"]);
  writeSource(
    workspace,
    ACTIVITY_SOURCE_PATH,
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
    ACTIVITY_SOURCE_PATH,
    `
export class ActivityRepository {
  async list() {
    return this.prisma["club"].findMany();
  }
}
`,
  );

  const violations = runGuard(workspace);

  assert.equal(violations.length, 1);
  assert.equal(violations[0].kind, "cross-boundary-prisma-model");
  assert.equal(violations[0].detected, 'this.prisma["club"].findMany');
});

test("fails when a Prisma client alias crosses the repository boundary", () => {
  const workspace = makeGitWorkspace();
  writeSchema(workspace);
  writeBoundary(workspace, ACTIVITY_BOUNDARY_PATH, ["activity"]);
  writeSource(
    workspace,
    ACTIVITY_SOURCE_PATH,
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
    ACTIVITY_SOURCE_PATH,
    `
export class ActivityRepository {
  async list() {
    const client = this.prisma;

    return client.club.findMany();
  }
}
`,
  );

  const violations = runGuard(workspace);

  assert.equal(violations.length, 1);
  assert.equal(violations[0].kind, "cross-boundary-prisma-model");
  assert.equal(violations[0].detected, "client.club.findMany");
});

test("fails when a destructured Prisma delegate crosses the repository boundary", () => {
  const workspace = makeGitWorkspace();
  writeSchema(workspace);
  writeBoundary(workspace, ACTIVITY_BOUNDARY_PATH, ["activity"]);
  writeSource(
    workspace,
    ACTIVITY_SOURCE_PATH,
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
    ACTIVITY_SOURCE_PATH,
    `
export class ActivityRepository {
  async list() {
    const { club } = this.prisma;

    return club.findMany();
  }
}
`,
  );

  const violations = runGuard(workspace);

  assert.equal(violations.length, 1);
  assert.equal(violations[0].kind, "cross-boundary-prisma-model");
  assert.equal(violations[0].detected, "club.findMany");
});

test("fails when a changed repository queries Prisma without a boundary manifest", () => {
  const workspace = makeGitWorkspace();
  writeSchema(workspace);
  writeSource(
    workspace,
    ACTIVITY_SOURCE_PATH,
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
    ACTIVITY_SOURCE_PATH,
    `
export class ActivityRepository {
  async list() {
    return this.prisma.activity.findMany();
  }
}
`,
  );

  const violations = runGuard(workspace);

  assert.equal(violations.length, 1);
  assert.equal(violations[0].kind, "missing-repository-boundary");
});

test("fails when a changed module exports a repository", () => {
  const workspace = makeGitWorkspace();
  writeSchema(workspace);
  writeSource(
    workspace,
    ACTIVITY_MODULE_PATH,
    `
import { Module } from "@nestjs/common";

@Module({
  exports: [],
})
export class ActivityModule {}
`,
  );
  commitAll(workspace, "base");

  writeSource(
    workspace,
    ACTIVITY_MODULE_PATH,
    `
import { Module } from "@nestjs/common";

@Module({
  exports: [ActivityRepository],
})
export class ActivityModule {}
`,
  );

  const violations = runGuard(workspace);

  assert.equal(violations.length, 1);
  assert.equal(violations[0].kind, "non-public-module-export");
  assert.equal(violations[0].detected, "ActivityRepository");
});

test("fails when a changed module exports a non-public service", () => {
  const workspace = makeGitWorkspace();
  writeSchema(workspace);
  writeSource(
    workspace,
    ACTIVITY_MODULE_PATH,
    `
import { Module } from "@nestjs/common";

@Module({
  exports: [],
})
export class ActivityModule {}
`,
  );
  commitAll(workspace, "base");

  writeSource(
    workspace,
    ACTIVITY_MODULE_PATH,
    `
import { Module } from "@nestjs/common";

@Module({
  exports: [ActivityService],
})
export class ActivityModule {}
`,
  );

  const violations = runGuard(workspace);

  assert.equal(violations.length, 1);
  assert.equal(violations[0].kind, "non-public-module-export");
  assert.equal(violations[0].detected, "ActivityService");
});

test("passes when a changed module exports only public services", () => {
  const workspace = makeGitWorkspace();
  writeSchema(workspace);
  writeSource(
    workspace,
    ACTIVITY_MODULE_PATH,
    `
import { Module } from "@nestjs/common";

@Module({
  exports: [],
})
export class ActivityModule {}
`,
  );
  commitAll(workspace, "base");

  writeSource(
    workspace,
    ACTIVITY_MODULE_PATH,
    `
import { Module } from "@nestjs/common";

@Module({
  exports: [ActivityPublicService, ActivityDurationPublicService],
})
export class ActivityModule {}
`,
  );

  assert.deepEqual(runGuard(workspace), []);
});

test("passes when a changed module has empty exports", () => {
  const workspace = makeGitWorkspace();
  writeSchema(workspace);
  writeSource(
    workspace,
    ACTIVITY_MODULE_PATH,
    `
import { Module } from "@nestjs/common";

@Module({
  exports: [ActivityPublicService],
})
export class ActivityModule {}
`,
  );
  commitAll(workspace, "base");

  writeSource(
    workspace,
    ACTIVITY_MODULE_PATH,
    `
import { Module } from "@nestjs/common";

@Module({
  exports: [],
})
export class ActivityModule {}
`,
  );

  assert.deepEqual(runGuard(workspace), []);
});

test("fails when a boundary declares a Prisma model that does not exist", () => {
  const workspace = makeGitWorkspace();
  writeSchema(workspace);
  writeSource(
    workspace,
    ACTIVITY_SOURCE_PATH,
    `
export class ActivityRepository {}
`,
  );
  commitAll(workspace, "base");

  writeBoundary(workspace, ACTIVITY_BOUNDARY_PATH, ["activityTypo"]);

  const violations = runGuard(workspace);

  assert.equal(violations.length, 1);
  assert.equal(violations[0].kind, "unknown-owned-prisma-model");
  assert.equal(violations[0].detected, "activityTypo");
});

test("fails when two boundaries declare the same Prisma model", () => {
  const workspace = makeGitWorkspace();
  writeSchema(workspace);
  writeSource(
    workspace,
    ACTIVITY_SOURCE_PATH,
    `
export class ActivityRepository {}
`,
  );
  commitAll(workspace, "base");

  writeBoundary(workspace, ACTIVITY_BOUNDARY_PATH, ["activity"]);
  writeBoundary(workspace, CLUB_BOUNDARY_PATH, ["activity"]);

  const violations = runGuard(workspace);

  assert.equal(violations.length, 1);
  assert.equal(violations[0].kind, "duplicate-owned-prisma-model");
  assert.equal(violations[0].detected, "activity");
});

test("passes when include stays inside the repository boundary", () => {
  const workspace = makeGitWorkspace();
  writeSchemaWithInternalRelations(workspace);
  writeBoundary(workspace, ACTIVITY_BOUNDARY_PATH, [
    "activity",
    "activityParticipant",
  ]);
  writeSource(
    workspace,
    ACTIVITY_SOURCE_PATH,
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
    ACTIVITY_SOURCE_PATH,
    `
export class ActivityRepository {
  async list() {
    return this.prisma.activity.findMany({
      include: {
        participants: true,
      },
    });
  }
}
`,
  );

  assert.deepEqual(runGuard(workspace), []);
});

test("fails when an owned Prisma model has a schema relation outside the repository boundary", () => {
  const workspace = makeGitWorkspace();
  writeSchemaWithCrossBoundaryRelations(workspace);
  writeBoundary(workspace, ACTIVITY_BOUNDARY_PATH, ["activity"]);
  writeSource(
    workspace,
    ACTIVITY_SOURCE_PATH,
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
    ACTIVITY_SOURCE_PATH,
    `
export class ActivityRepository {
  async list() {
    return this.prisma.activity.findMany({
      include: {
        club: true,
      },
    });
  }
}
`,
  );

  const violations = runGuard(workspace);
  const violation = violations.find(
    item =>
      item.kind === "cross-boundary-schema-relation" &&
      item.detected === "activity.club",
  );

  assert.ok(violation);
});

test("passes when select reads scalar fields", () => {
  const workspace = makeGitWorkspace();
  writeSchema(workspace);
  writeBoundary(workspace, ACTIVITY_BOUNDARY_PATH, ["activity"]);
  writeSource(
    workspace,
    ACTIVITY_SOURCE_PATH,
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
    ACTIVITY_SOURCE_PATH,
    `
export class ActivityRepository {
  async get() {
    return this.prisma.activity.findFirst({
      select: {
        id: true,
        clubId: true,
      },
    });
  }
}
`,
  );

  assert.deepEqual(runGuard(workspace), []);
});

test("fails when relation select crosses the repository boundary", () => {
  const workspace = makeGitWorkspace();
  writeSchemaWithCrossBoundaryRelations(workspace);
  writeBoundary(workspace, ACTIVITY_BOUNDARY_PATH, ["activity"]);
  writeSource(
    workspace,
    ACTIVITY_SOURCE_PATH,
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
    ACTIVITY_SOURCE_PATH,
    `
export class ActivityRepository {
  async get() {
    return this.prisma.activity.findFirst({
      select: {
        club: {
          select: { id: true },
        },
      },
    });
  }
}
`,
  );

  const violations = runGuard(workspace);
  const violation = violations.find(
    item =>
      item.kind === "cross-boundary-schema-relation" &&
      item.detected === "activity.club",
  );

  assert.ok(violation);
});

test("fails when a nested owned Prisma model has a schema relation outside the repository boundary", () => {
  const workspace = makeGitWorkspace();
  writeSchemaWithCrossBoundaryRelations(workspace);
  writeBoundary(workspace, ACTIVITY_BOUNDARY_PATH, [
    "activity",
    "activityParticipant",
  ]);
  writeSource(
    workspace,
    ACTIVITY_SOURCE_PATH,
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
    ACTIVITY_SOURCE_PATH,
    `
export class ActivityRepository {
  async list() {
    return this.prisma.activity.findMany({
      include: {
        participants: {
          include: {
            student: true,
          },
        },
      },
    });
  }
}
`,
  );

  const violations = runGuard(workspace);
  const violation = violations.find(
    item =>
      item.kind === "cross-boundary-schema-relation" &&
      item.detected === "activityParticipant.student",
  );

  assert.ok(violation);
});

function runGuard(workspace) {
  const diff = execFileSync(
    "git",
    ["diff", "--unified=0", "--no-color", "--diff-filter=ACMR", "HEAD", "--"],
    { cwd: workspace, encoding: "utf8" },
  );

  return findChangedRepositoryDomainViolations({
    changedFiles: parseChangedFileLineMap(diff),
    repoRoot: workspace,
    schemaPath: SCHEMA_PATH,
  });
}

function makeGitWorkspace() {
  const workspace = fs.mkdtempSync(
    path.join(os.tmpdir(), "repository-domain-guard-"),
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
  id           Int                   @id @default(autoincrement())
  clubId       Int
}

model ActivityParticipant {
  id         Int      @id @default(autoincrement())
  activityId Int
  studentId  Int
}

model Club {
  id         Int        @id @default(autoincrement())
  activities Activity[]
}

model Student {
  id                   Int                   @id @default(autoincrement())
  activityParticipants ActivityParticipant[]
}
`,
  );
}

function writeSchemaWithInternalRelations(workspace) {
  writeFile(
    workspace,
    SCHEMA_PATH,
    `
model Activity {
  id           Int                   @id @default(autoincrement())
  clubId       Int
  participants ActivityParticipant[]
}

model ActivityParticipant {
  id         Int      @id @default(autoincrement())
  activityId Int
  studentId  Int
  activity   Activity @relation(fields: [activityId], references: [id])
}

model Club {
  id Int @id @default(autoincrement())
}

model Student {
  id Int @id @default(autoincrement())
}
`,
  );
}

function writeSchemaWithCrossBoundaryRelations(workspace) {
  writeFile(
    workspace,
    SCHEMA_PATH,
    `
model Activity {
  id           Int                   @id @default(autoincrement())
  clubId       Int
  club         Club                  @relation(fields: [clubId], references: [id])
  participants ActivityParticipant[]
}

model ActivityParticipant {
  id         Int      @id @default(autoincrement())
  activityId Int
  studentId  Int
  activity   Activity @relation(fields: [activityId], references: [id])
  student    Student  @relation(fields: [studentId], references: [id])
}

model Club {
  id         Int        @id @default(autoincrement())
  activities Activity[]
}

model Student {
  id                   Int                   @id @default(autoincrement())
  activityParticipants ActivityParticipant[]
}
`,
  );
}

function writeBoundary(workspace, filePath, ownedPrismaModels) {
  const models = ownedPrismaModels.map(model => `"${model}"`).join(", ");
  writeFile(
    workspace,
    filePath,
    `
export const repositoryBoundary = {
  ownedPrismaModels: [${models}],
} as const;
`,
  );
}

function writeSource(workspace, filePath, sourceText) {
  writeFile(workspace, filePath, sourceText);
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
