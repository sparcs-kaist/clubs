import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  findChangedTransactionViolations,
  parseChangedFileLineMap,
} from "./changed-transaction-guard.mjs";

const SERVICE_PATH =
  "packages/api/src/feature/operation-committee/service/operation-committee.service.ts";
const REPOSITORY_PATH =
  "packages/api/src/feature/operation-committee/repository/operation-committee.repository.ts";

test("fails when a changed service method calls a repository command without @Transactional", () => {
  const workspace = makeGitWorkspace();
  writeFile(
    workspace,
    REPOSITORY_PATH,
    `
export class OperationCommitteeRepository {
  async createOperationCommitteeSecretKey(secretKey: string) {
    return this.txHost.tx.operationCommitteeSecretKey.create({
      data: { secretKey },
    });
  }
}
`,
  );
  writeFile(
    workspace,
    SERVICE_PATH,
    `
export class OperationCommitteeService {
  constructor(private readonly operationCommitteeRepository: OperationCommitteeRepository) {}

  async createOperationCommitteeSecretKey(secretKey: string) {
    return secretKey;
  }
}
`,
  );
  commitAll(workspace, "base");

  writeFile(
    workspace,
    SERVICE_PATH,
    `
export class OperationCommitteeService {
  constructor(private readonly operationCommitteeRepository: OperationCommitteeRepository) {}

  async createOperationCommitteeSecretKey(secretKey: string) {
    return this.operationCommitteeRepository.createOperationCommitteeSecretKey(secretKey);
  }
}
`,
  );

  const violations = runGuard(workspace);

  assert.equal(violations.length, 1);
  assert.equal(violations[0].kind, "service-command-without-transactional");
});

test("passes when a changed service command method has @Transactional", () => {
  const workspace = makeGitWorkspace();
  writeFile(
    workspace,
    REPOSITORY_PATH,
    `
export class OperationCommitteeRepository {
  async createOperationCommitteeSecretKey(secretKey: string) {
    return this.txHost.tx.operationCommitteeSecretKey.create({
      data: { secretKey },
    });
  }
}
`,
  );
  writeFile(
    workspace,
    SERVICE_PATH,
    `
export class OperationCommitteeService {
  constructor(private readonly operationCommitteeRepository: OperationCommitteeRepository) {}

  async createOperationCommitteeSecretKey(secretKey: string) {
    return secretKey;
  }
}
`,
  );
  commitAll(workspace, "base");

  writeFile(
    workspace,
    SERVICE_PATH,
    `
export class OperationCommitteeService {
  constructor(private readonly operationCommitteeRepository: OperationCommitteeRepository) {}

  @Transactional()
  async createOperationCommitteeSecretKey(secretKey: string) {
    return this.operationCommitteeRepository.createOperationCommitteeSecretKey(secretKey);
  }
}
`,
  );

  assert.deepEqual(runGuard(workspace), []);
});

test("fails when a changed line is inside an existing non-transactional service command method", () => {
  const workspace = makeGitWorkspace();
  writeFile(
    workspace,
    REPOSITORY_PATH,
    `
export class OperationCommitteeRepository {
  async createOperationCommitteeSecretKey(secretKey: string) {
    return this.txHost.tx.operationCommitteeSecretKey.create({
      data: { secretKey },
    });
  }
}
`,
  );
  writeFile(
    workspace,
    SERVICE_PATH,
    `
export class OperationCommitteeService {
  constructor(private readonly operationCommitteeRepository: OperationCommitteeRepository) {}

  async createOperationCommitteeSecretKey(secretKey: string) {
    const normalized = secretKey.trim();
    return this.operationCommitteeRepository.createOperationCommitteeSecretKey(normalized);
  }
}
`,
  );
  commitAll(workspace, "base");

  writeFile(
    workspace,
    SERVICE_PATH,
    `
export class OperationCommitteeService {
  constructor(private readonly operationCommitteeRepository: OperationCommitteeRepository) {}

  async createOperationCommitteeSecretKey(secretKey: string) {
    const normalized = secretKey.trim().toLowerCase();
    return this.operationCommitteeRepository.createOperationCommitteeSecretKey(normalized);
  }
}
`,
  );

  const violations = runGuard(workspace);

  assert.equal(violations.length, 1);
  assert.equal(violations[0].kind, "service-command-without-transactional");
});

test("fails when a changed repository command writes through root PrismaService", () => {
  const workspace = makeGitWorkspace();
  writeFile(
    workspace,
    REPOSITORY_PATH,
    `
export class OperationCommitteeRepository {
  async findOperationCommitteeSecretKey() {
    return this.prisma.operationCommitteeSecretKey.findFirst();
  }
}
`,
  );
  commitAll(workspace, "base");

  writeFile(
    workspace,
    REPOSITORY_PATH,
    `
export class OperationCommitteeRepository {
  async findOperationCommitteeSecretKey() {
    return this.prisma.operationCommitteeSecretKey.findFirst();
  }

  async createOperationCommitteeSecretKey(secretKey: string) {
    return this.prisma.operationCommitteeSecretKey.create({
      data: { secretKey },
    });
  }
}
`,
  );

  const violations = runGuard(workspace);

  assert.equal(violations.length, 1);
  assert.equal(violations[0].kind, "root-prisma-in-repository-command");
});

test("passes when untouched legacy manual transactions remain", () => {
  const workspace = makeGitWorkspace();
  writeFile(
    workspace,
    REPOSITORY_PATH,
    `
export class OperationCommitteeRepository {
  async withTransaction(callback) {
    return this.prisma.$transaction(callback);
  }
}
`,
  );
  commitAll(workspace, "base");

  writeFile(
    workspace,
    REPOSITORY_PATH,
    `
export class OperationCommitteeRepository {
  async withTransaction(callback) {
    return this.prisma.$transaction(callback);
  }

  async findOperationCommitteeSecretKey() {
    return this.txHost.tx.operationCommitteeSecretKey.findFirst();
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

  return findChangedTransactionViolations({
    baseRef: "HEAD",
    changedFiles: parseChangedFileLineMap(diff),
    repoRoot: workspace,
  });
}

function makeGitWorkspace() {
  const workspace = fs.mkdtempSync(
    path.join(os.tmpdir(), "transaction-guard-"),
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
