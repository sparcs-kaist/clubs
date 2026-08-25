import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  findChangedServiceDbAccessViolations,
  findServiceDbAccessNodes,
} from "./changed-service-db-access-guard.mjs";

test("detects direct PrismaService and TransactionHost calls in services", () => {
  const result = findServiceDbAccessNodes({
    filePath: "packages/api/src/feature/example/service/example.service.ts",
    sourceText: `
export class ExampleService {
  constructor(
    private readonly database: PrismaService,
    private readonly transaction: TransactionHost<Adapter>,
  ) {}

  async run() {
    await this.database.club.findMany();
    await this.transaction.tx.club.updateMany({});
    await this.database.$transaction(async () => undefined);
    await this.database.$queryRaw\`SELECT 1\`;
  }
}
`,
  });

  assert.equal(result.parseError, null);
  assert.deepEqual(
    result.nodes.map(node => node.detected),
    [
      "this.database.club.findMany",
      "this.transaction.tx.club.updateMany",
      "this.database.$transaction",
      "this.database.$queryRaw",
    ],
  );
});

test("detects aliases, destructuring, and bracket access", () => {
  const result = findServiceDbAccessNodes({
    filePath: "packages/api/src/feature/example/service/example.service.ts",
    sourceText: `
export class ExampleService {
  constructor(
    private readonly database: PrismaService,
    private readonly transaction: TransactionHost<Adapter>,
  ) {}

  async run() {
    const client = this.database;
    await client["club"]["findMany"]();
    const { tx: context } = this.transaction;
    const { club: clubTable } = context;
    await clubTable.updateMany({});
  }
}
`,
  });

  assert.deepEqual(
    result.nodes.map(node => node.detected),
    ['client["club"]["findMany"]', "clubTable.updateMany"],
  );
});

test("allows services to call repository commands", () => {
  const result = findServiceDbAccessNodes({
    filePath: "packages/api/src/feature/example/service/example.service.ts",
    sourceText: `
export class ExampleService {
  constructor(private readonly exampleRepository: ExampleRepository) {}

  async run() {
    await this.exampleRepository.saveExample();
  }
}
`,
  });

  assert.deepEqual(result.nodes, []);
});

test("reports only direct DB calls touched by changed lines", () => {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), "service-db-guard-"));
  const filePath =
    "packages/api/src/feature/example/service/example.service.ts";
  const fullPath = path.join(repoRoot, filePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(
    fullPath,
    [
      "export class ExampleService {",
      "  constructor(private readonly prisma: PrismaService) {}",
      "  async run() {",
      "    await this.prisma.club.findMany();",
      "  }",
      "}",
    ].join("\n"),
  );

  const changedFile = {
    path: filePath,
    addedRanges: [{ startLine: 4, endLine: 4 }],
    deletedLines: [],
  };
  assert.equal(
    findChangedServiceDbAccessViolations({
      changedFiles: [changedFile],
      repoRoot,
    }).length,
    1,
  );
  assert.equal(
    findChangedServiceDbAccessViolations({
      changedFiles: [
        {
          ...changedFile,
          addedRanges: [{ startLine: 1, endLine: 1 }],
        },
      ],
      repoRoot,
    }).length,
    0,
  );
});
