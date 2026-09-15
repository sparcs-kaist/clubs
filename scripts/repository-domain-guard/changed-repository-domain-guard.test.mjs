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

test("allows explicit schema imports from exporting owners, including metadata cycles", () => {
  const workspace = makeImportedWorkspace();
  writeQuery(
    workspace,
    "this.prisma.activity.findMany({ select: { id: true }, include: { participants: true } })",
  );
  assert.deepEqual(runGuard(workspace), []);
});

test("an imported model does not grant direct delegate access", () => {
  const workspace = makeImportedWorkspace();
  writeQuery(workspace, "this.prisma.club.findMany()");
  assert.ok(
    runGuard(workspace).some(
      item => item.kind === "cross-boundary-prisma-model",
    ),
  );
});

for (const [label, expression] of [
  ["include", "findMany({ include: { club: true } })"],
  ["select", "findMany({ select: { club: { select: { id: true } } } })"],
  ["where", "findMany({ where: { OR: [{ club: { is: { id: 1 } } }] } })"],
  [
    "nested where",
    "findMany({ where: { participants: { some: { student: { is: { id: 1 } } } } } })",
  ],
  ["orderBy", "findMany({ orderBy: [{ club: { id: 'asc' } }] })"],
  [
    "count select",
    "findMany({ select: { _count: { select: { club: true } } } })",
  ],
  ["count filter", "count({ where: { club: { isNot: null } } })"],
  ["create nested write", "create({ data: { club: { create: { id: 1 } } } })"],
  [
    "update nested write",
    "update({ where: { id: 1 }, data: { club: { connect: { id: 1 } } } })",
  ],
  [
    "upsert create",
    "upsert({ where: { id: 1 }, create: { club: { connect: { id: 1 } } }, update: {} })",
  ],
  [
    "upsert update",
    "upsert({ where: { id: 1 }, create: {}, update: { club: { disconnect: true } } })",
  ],
  [
    "nested upsert",
    "update({ data: { participants: { upsert: { where: { id: 1 }, create: {}, update: { student: { connect: { id: 1 } } } } } } })",
  ],
  [
    "connectOrCreate",
    "update({ data: { participants: { connectOrCreate: { where: { id: 1 }, create: { student: { connect: { id: 1 } } } } } } })",
  ],
  [
    "nested updateMany",
    "update({ data: { participants: { updateMany: [{ where: { student: { is: { id: 1 } } }, data: {} }] } } })",
  ],
]) {
  test(`import metadata cannot authorize foreign relation ${label}`, () => {
    const workspace = makeImportedWorkspace();
    writeQuery(workspace, `this.prisma.activity.${expression}`);
    const violations = runGuard(workspace);
    assert.ok(
      violations.some(
        item => item.kind === "cross-boundary-relation-traversal",
      ),
      label,
    );
    assert.ok(
      !violations.some(item => item.kind === "cross-boundary-schema-relation"),
    );
  });
}

test("owned relation filters and nested writes remain allowed", () => {
  const workspace = makeImportedWorkspace();
  writeQuery(
    workspace,
    `this.prisma.activity.upsert({
    where: { id: 1, participants: { some: { id: 2 } } },
    create: { participants: { create: [{ id: 2 }] } },
    update: { participants: { updateMany: { where: { id: 2 }, data: { studentId: 3 } } } },
    include: { participants: { select: { id: true }, orderBy: { id: 'asc' } } },
  })`,
  );
  assert.deepEqual(runGuard(workspace), []);
});

test("resolves local query objects, shorthand filters, and spread relations", () => {
  const workspace = makeImportedWorkspace();
  writeSource(
    workspace,
    ACTIVITY_SOURCE_PATH,
    `
    export class ActivityRepository {
      async list() {
        const relation = { club: { is: { id: 1 } } };
        const where = { ...relation };
        const query = { where };
        return this.prisma.activity.findMany(query);
      }
    }
  `,
  );
  assert.ok(
    runGuard(workspace).some(
      item => item.kind === "cross-boundary-relation-traversal",
    ),
  );
});

test("local query bindings respect lexical scopes", () => {
  const workspace = makeImportedWorkspace();
  writeSource(
    workspace,
    ACTIVITY_SOURCE_PATH,
    `
    const where = { club: { is: { id: 1 } } };
    export class ActivityRepository {
      async list() {
        const where = { id: 1 };
        return this.prisma.activity.findMany({ where });
      }
    }
  `,
  );
  assert.deepEqual(runGuard(workspace), []);
});

test("changing another line in a query still checks its imported relation", () => {
  const workspace = makeImportedWorkspace();
  const query = `this.prisma.activity.findMany({
    include: { club: true },
    take: 1,
  })`;
  writeQuery(workspace, query);
  commitAll(workspace, "legacy query");
  writeQuery(workspace, query.replace("take: 1", "take: 2"));
  assert.ok(
    runGuard(workspace).some(
      item => item.kind === "cross-boundary-relation-traversal",
    ),
  );
});

test("a parameter shadows an unrelated outer query constant", () => {
  const workspace = makeImportedWorkspace();
  writeSource(
    workspace,
    ACTIVITY_SOURCE_PATH,
    `
    const where = { club: { is: { id: 1 } } };
    export class ActivityRepository {
      async list(where: { id: number }) {
        return this.prisma.activity.findMany({ where });
      }
    }
  `,
  );
  assert.deepEqual(runGuard(workspace), []);
});

test("a changed query cannot use an untouched external-relation constant", () => {
  const workspace = makeImportedWorkspace();
  const source = `const query = { where: { club: { is: { id: 1 } } } };
    export class ActivityRepository { async list() { return []; } }`;
  writeSource(workspace, ACTIVITY_SOURCE_PATH, source);
  commitAll(workspace, "existing constant");
  writeSource(
    workspace,
    ACTIVITY_SOURCE_PATH,
    source.replace("return []", "return this.prisma.activity.findMany(query)"),
  );
  assert.ok(
    runGuard(workspace).some(
      item => item.kind === "cross-boundary-relation-traversal",
    ),
  );
});

test("_count true is allowed when every list relation is owned", () => {
  const workspace = makeImportedWorkspace();
  writeQuery(
    workspace,
    "this.prisma.activity.findMany({ select: { _count: true } })",
  );
  assert.deepEqual(runGuard(workspace), []);
});

test("_count true and local aliases cannot implicitly count an imported list relation", () => {
  const workspace = makeImportedWorkspace();
  const schemaPath = path.join(workspace, SCHEMA_PATH);
  const schema = fs.readFileSync(schemaPath, "utf8");
  fs.writeFileSync(
    schemaPath,
    schema
      .replace(
        "  clubId       Int\n",
        '  clubId       Int\n  otherClubs Club[] @relation("OtherClubs")\n',
      )
      .replace(
        "  activities Activity[]\n",
        '  activities Activity[]\n  otherActivities Activity[] @relation("OtherClubs")\n',
      ),
  );
  for (const count of ["true", "all", "alias"]) {
    writeSource(
      workspace,
      ACTIVITY_SOURCE_PATH,
      `
      const all = true;
      const alias = all;
      export class ActivityRepository {
        async list() { return this.prisma.activity.findMany({ include: { _count: ${count} } }); }
      }
    `,
    );
    assert.ok(
      runGuard(workspace).some(
        item =>
          item.kind === "cross-boundary-relation-traversal" &&
          item.detected === "activity.otherClubs",
      ),
      count,
    );
  }
  commitAll(workspace, "existing count alias");
  const sourcePath = path.join(workspace, ACTIVITY_SOURCE_PATH);
  const source = fs.readFileSync(sourcePath, "utf8");
  fs.writeFileSync(
    sourcePath,
    source.replace("const all = true", "const all = false"),
  );
  assert.deepEqual(runGuard(workspace), []);
  commitAll(workspace, "disable counts");
  fs.writeFileSync(sourcePath, source);
  assert.ok(
    runGuard(workspace).some(
      item => item.kind === "cross-boundary-relation-traversal",
    ),
  );
});

const STUDENT_BOUNDARY_PATH =
  "packages/api/src/feature/user/repository/repository-boundary.ts";

for (const [label, update, expectedKind] of [
  [
    "export of an unowned model",
    { exportedPrismaModels: ["club"] },
    "invalid-boundary-export",
  ],
  [
    "import from a non-owner",
    {
      importedPrismaModels: [{ from: STUDENT_BOUNDARY_PATH, models: ["club"] }],
    },
    "invalid-boundary-import",
  ],
  [
    "import of an unknown model",
    {
      importedPrismaModels: [{ from: CLUB_BOUNDARY_PATH, models: ["unknown"] }],
    },
    "invalid-boundary-import",
  ],
  [
    "import from a missing manifest",
    {
      importedPrismaModels: [
        {
          from: "packages/api/src/missing/repository-boundary.ts",
          models: ["club"],
        },
      ],
    },
    "invalid-boundary-import",
  ],
  [
    "import of an owned model",
    {
      importedPrismaModels: [
        { from: ACTIVITY_BOUNDARY_PATH, models: ["activity"] },
      ],
    },
    "invalid-boundary-import",
  ],
  [
    "duplicate imports",
    {
      importedPrismaModels: [
        { from: CLUB_BOUNDARY_PATH, models: ["club"] },
        { from: CLUB_BOUNDARY_PATH, models: ["club"] },
      ],
    },
    "invalid-boundary-import",
  ],
  [
    "undeclared schema relation",
    { importedPrismaModels: [] },
    "cross-boundary-schema-relation",
  ],
  [
    "duplicate owned models",
    { ownedPrismaModels: ["activity", "activity"] },
    "invalid-repository-boundary",
  ],
  [
    "path traversal",
    {
      importedPrismaModels: [
        { from: `../${CLUB_BOUNDARY_PATH}`, models: ["club"] },
      ],
    },
    "invalid-repository-boundary",
  ],
  [
    "absolute import path",
    {
      importedPrismaModels: [
        { from: `/${CLUB_BOUNDARY_PATH}`, models: ["club"] },
      ],
    },
    "invalid-repository-boundary",
  ],
]) {
  test(`rejects ${label} without querying Prisma`, () => {
    const workspace = makeImportedWorkspace();
    updateContract(workspace, ACTIVITY_BOUNDARY_PATH, update);
    assert.ok(
      runGuard(workspace).some(item => item.kind === expectedKind),
      label,
    );
  });
}

test("imports require the actual owner to explicitly export the model", () => {
  const workspace = makeImportedWorkspace();
  updateContract(workspace, CLUB_BOUNDARY_PATH, { exportedPrismaModels: [] });
  assert.ok(
    runGuard(workspace).some(
      item =>
        item.kind === "invalid-boundary-import" &&
        item.reason.includes("does not export club"),
    ),
  );
});

test("an imported model cannot be re-exported by a non-owner", () => {
  const workspace = makeImportedWorkspace();
  updateContract(workspace, STUDENT_BOUNDARY_PATH, {
    exportedPrismaModels: ["student", "activity"],
  });
  updateContract(workspace, CLUB_BOUNDARY_PATH, {
    importedPrismaModels: [
      { from: STUDENT_BOUNDARY_PATH, models: ["activity"] },
    ],
  });
  const violations = runGuard(workspace);
  assert.ok(violations.some(item => item.kind === "invalid-boundary-export"));
  assert.ok(
    violations.some(
      item =>
        item.kind === "invalid-boundary-import" &&
        item.reason.includes("does not own activity"),
    ),
  );
});

for (const fields of [
  "exportedPrismaModels: getModels()",
  "exportedPrismaModels: [model]",
  "importedPrismaModels: getImports()",
  "importedPrismaModels: [{ from: path, models: ['club'] }]",
  `importedPrismaModels: [{ from: '${CLUB_BOUNDARY_PATH}', models: [model] }]`,
  `importedPrismaModels: [{ from: '${CLUB_BOUNDARY_PATH}' }]`,
  "...extra",
  "allowedExternalReads: ['club']",
]) {
  test(`rejects non-static or unsupported manifest fields: ${fields}`, () => {
    const workspace = makeImportedWorkspace();
    writeFile(
      workspace,
      ACTIVITY_BOUNDARY_PATH,
      `export const repositoryBoundary = { ownedPrismaModels: ['activity'], ${fields} } as const;`,
    );
    assert.ok(
      runGuard(workspace).some(
        item => item.kind === "invalid-repository-boundary",
      ),
    );
  });
}

function updateContract(workspace, filePath, update) {
  const source = fs.readFileSync(path.join(workspace, filePath), "utf8");
  const contract = JSON.parse(
    source
      .slice(source.indexOf("=") + 1, source.lastIndexOf("as const"))
      .trim(),
  );
  writeContract(workspace, filePath, { ...contract, ...update });
}

function writeContract(workspace, filePath, contract) {
  writeFile(
    workspace,
    filePath,
    `export const repositoryBoundary = ${JSON.stringify(contract, null, 2)} as const;\n`,
  );
}

function makeImportedWorkspace() {
  const workspace = makeGitWorkspace();
  writeSchemaWithCrossBoundaryRelations(workspace);
  writeContract(workspace, ACTIVITY_BOUNDARY_PATH, {
    ownedPrismaModels: ["activity", "activityParticipant"],
    exportedPrismaModels: ["activity", "activityParticipant"],
    importedPrismaModels: [
      { from: CLUB_BOUNDARY_PATH, models: ["club"] },
      { from: STUDENT_BOUNDARY_PATH, models: ["student"] },
    ],
  });
  writeContract(workspace, CLUB_BOUNDARY_PATH, {
    ownedPrismaModels: ["club"],
    exportedPrismaModels: ["club"],
    importedPrismaModels: [
      { from: ACTIVITY_BOUNDARY_PATH, models: ["activity"] },
    ],
  });
  writeContract(workspace, STUDENT_BOUNDARY_PATH, {
    ownedPrismaModels: ["student"],
    exportedPrismaModels: ["student"],
    importedPrismaModels: [
      { from: ACTIVITY_BOUNDARY_PATH, models: ["activityParticipant"] },
    ],
  });
  writeQuery(workspace, "[]");
  commitAll(workspace, "base");
  return workspace;
}

function writeQuery(workspace, expression) {
  writeSource(
    workspace,
    ACTIVITY_SOURCE_PATH,
    `export class ActivityRepository { async list() { return ${expression}; } }`,
  );
}

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
