import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  findChangedBaseRepositoryViolations,
  parseChangedFileLineMap,
} from "./changed-base-repository-guard.mjs";

const SERVICE_PATH =
  "packages/api/src/feature/notice/service/notice.service.ts";
const REPOSITORY_PATH =
  "packages/api/src/feature/notice/repository/notice.repository.ts";
const CUSTOM_REPOSITORY_PATH =
  "packages/api/src/feature/funding/repository/funding.repository.ts";

test("fails when a changed service calls an inherited BaseRepository write method", () => {
  const workspace = makeGitWorkspace();
  writeBaseRepositorySubclass(workspace);
  writeFile(
    workspace,
    SERVICE_PATH,
    `
export class NoticeService {
  constructor(private readonly noticeRepository: NoticeRepository) {}

  async syncNotice(input: INoticeCreate) {
    return input;
  }
}
`,
  );
  commitAll(workspace, "base");

  writeFile(
    workspace,
    SERVICE_PATH,
    `
export class NoticeService {
  constructor(private readonly noticeRepository: NoticeRepository) {}

  async syncNotice(input: INoticeCreate) {
    return this.noticeRepository.create(input);
  }
}
`,
  );

  const violations = runGuard(workspace);

  assert.equal(violations.length, 1);
  assert.equal(violations[0].kind, "service-base-repository-write");
  assert.equal(violations[0].detected, "this.noticeRepository.create");
});

test("fails when a changed BaseRepository subclass method calls this.patch", () => {
  const workspace = makeGitWorkspace();
  writeBaseRepositorySubclass(workspace);
  commitAll(workspace, "base");

  writeFile(
    workspace,
    REPOSITORY_PATH,
    `
export class NoticeRepository extends BaseSingleTableRepository<MNotice, INoticeCreate, NoticeQuery> {
  async normalizeNotice(id: number) {
    return this.patch({ id }, notice => notice);
  }
}
`,
  );

  const violations = runGuard(workspace);

  assert.equal(violations.length, 1);
  assert.equal(violations[0].kind, "repository-base-repository-write");
  assert.equal(violations[0].detected, "this.patch");
});

test("fails when a changed BaseRepository subclass method calls super.delete", () => {
  const workspace = makeGitWorkspace();
  writeBaseRepositorySubclass(workspace);
  commitAll(workspace, "base");

  writeFile(
    workspace,
    REPOSITORY_PATH,
    `
export class NoticeRepository extends BaseSingleTableRepository<MNotice, INoticeCreate, NoticeQuery> {
  async removeNotice(id: number) {
    return super.delete({ id });
  }
}
`,
  );

  const violations = runGuard(workspace);

  assert.equal(violations.length, 1);
  assert.equal(violations[0].kind, "repository-base-repository-write");
  assert.equal(violations[0].detected, "super.delete");
});

test("fails when a changed line is inside an existing service method that calls BaseRepository", () => {
  const workspace = makeGitWorkspace();
  writeBaseRepositorySubclass(workspace);
  writeFile(
    workspace,
    SERVICE_PATH,
    `
export class NoticeService {
  constructor(private readonly noticeRepository: NoticeRepository) {}

  async syncNotice(input: INoticeCreate) {
    const normalized = input;
    return this.noticeRepository.create(normalized);
  }
}
`,
  );
  commitAll(workspace, "base");

  writeFile(
    workspace,
    SERVICE_PATH,
    `
export class NoticeService {
  constructor(private readonly noticeRepository: NoticeRepository) {}

  async syncNotice(input: INoticeCreate) {
    const normalized = { ...input };
    return this.noticeRepository.create(normalized);
  }
}
`,
  );

  const violations = runGuard(workspace);

  assert.equal(violations.length, 1);
  assert.equal(violations[0].kind, "service-base-repository-write");
});

test("fails when a changed service calls a BaseRepository write wrapper with Tx suffix", () => {
  const workspace = makeGitWorkspace();
  writeFile(
    workspace,
    REPOSITORY_PATH,
    `
export class NoticeRepository extends BaseSingleTableRepository<MNotice, INoticeCreate, NoticeQuery> {
  async createTx(input: INoticeCreate, tx: PrismaTransactionClient) {
    return this.create(input, tx);
  }
}
`,
  );
  writeFile(
    workspace,
    SERVICE_PATH,
    `
export class NoticeService {
  constructor(private readonly noticeRepository: NoticeRepository) {}

  async syncNotice(input: INoticeCreate, tx: PrismaTransactionClient) {
    return input;
  }
}
`,
  );
  commitAll(workspace, "base");

  writeFile(
    workspace,
    SERVICE_PATH,
    `
export class NoticeService {
  constructor(private readonly noticeRepository: NoticeRepository) {}

  async syncNotice(input: INoticeCreate, tx: PrismaTransactionClient) {
    return this.noticeRepository.createTx(input, tx);
  }
}
`,
  );

  const violations = runGuard(workspace);

  assert.equal(violations.length, 1);
  assert.equal(violations[0].kind, "service-base-repository-write");
  assert.equal(violations[0].detected, "this.noticeRepository.createTx");
});

test("fails when a changed service aliases a repository before calling inherited BaseRepository write", () => {
  const workspace = makeGitWorkspace();
  writeBaseRepositorySubclass(workspace);
  writeFile(
    workspace,
    SERVICE_PATH,
    `
export class NoticeService {
  constructor(private readonly noticeRepository: NoticeRepository) {}

  async syncNotice(input: INoticeCreate) {
    return input;
  }
}
`,
  );
  commitAll(workspace, "base");

  writeFile(
    workspace,
    SERVICE_PATH,
    `
export class NoticeService {
  constructor(private readonly noticeRepository: NoticeRepository) {}

  async syncNotice(input: INoticeCreate) {
    const repository = this.noticeRepository;
    return repository.create(input);
  }
}
`,
  );

  const violations = runGuard(workspace);

  assert.equal(violations.length, 1);
  assert.equal(violations[0].kind, "service-base-repository-write");
  assert.equal(violations[0].detected, "repository.create");
});

test("fails when a changed service calls inherited BaseRepository write with bracket access", () => {
  const workspace = makeGitWorkspace();
  writeBaseRepositorySubclass(workspace);
  writeFile(
    workspace,
    SERVICE_PATH,
    `
export class NoticeService {
  constructor(private readonly noticeRepository: NoticeRepository) {}

  async syncNotice(input: INoticeCreate) {
    return input;
  }
}
`,
  );
  commitAll(workspace, "base");

  writeFile(
    workspace,
    SERVICE_PATH,
    `
export class NoticeService {
  constructor(private readonly noticeRepository: NoticeRepository) {}

  async syncNotice(input: INoticeCreate) {
    return this.noticeRepository["create"](input);
  }
}
`,
  );

  const violations = runGuard(workspace);

  assert.equal(violations.length, 1);
  assert.equal(violations[0].kind, "service-base-repository-write");
  assert.equal(violations[0].detected, 'this.noticeRepository["create"]');
});

test("fails when a changed service extracts an inherited BaseRepository write method", () => {
  const workspace = makeGitWorkspace();
  writeBaseRepositorySubclass(workspace);
  writeFile(
    workspace,
    SERVICE_PATH,
    `
export class NoticeService {
  constructor(private readonly noticeRepository: NoticeRepository) {}

  async syncNotice(input: INoticeCreate) {
    return input;
  }
}
`,
  );
  commitAll(workspace, "base");

  writeFile(
    workspace,
    SERVICE_PATH,
    `
export class NoticeService {
  constructor(private readonly noticeRepository: NoticeRepository) {}

  async syncNotice(input: INoticeCreate) {
    const create = this.noticeRepository.create;
    return create(input);
  }
}
`,
  );

  const violations = runGuard(workspace);

  assert.equal(violations.length, 1);
  assert.equal(violations[0].kind, "service-base-repository-write");
  assert.equal(violations[0].detected, "this.noticeRepository.create");
});

test("fails when a changed service destructures an inherited BaseRepository write method", () => {
  const workspace = makeGitWorkspace();
  writeBaseRepositorySubclass(workspace);
  writeFile(
    workspace,
    SERVICE_PATH,
    `
export class NoticeService {
  constructor(private readonly noticeRepository: NoticeRepository) {}

  async syncNotice(input: INoticeCreate) {
    return input;
  }
}
`,
  );
  commitAll(workspace, "base");

  writeFile(
    workspace,
    SERVICE_PATH,
    `
export class NoticeService {
  constructor(private readonly noticeRepository: NoticeRepository) {}

  async syncNotice(input: INoticeCreate) {
    const { create } = this.noticeRepository;
    return create(input);
  }
}
`,
  );

  const violations = runGuard(workspace);

  assert.equal(violations.length, 1);
  assert.equal(violations[0].kind, "service-base-repository-write");
  assert.equal(violations[0].detected, "this.noticeRepository.create");
});

test("fails when a changed service calls an inherited wrapper from a parent repository class", () => {
  const workspace = makeGitWorkspace();
  writeFile(
    workspace,
    REPOSITORY_PATH,
    `
export abstract class BaseNoticeRepository extends BaseSingleTableRepository<MNotice, INoticeCreate, NoticeQuery> {
  async createTx(input: INoticeCreate, tx: PrismaTransactionClient) {
    return this.create(input, tx);
  }
}

export class NoticeRepository extends BaseNoticeRepository {}
`,
  );
  writeFile(
    workspace,
    SERVICE_PATH,
    `
export class NoticeService {
  constructor(private readonly noticeRepository: NoticeRepository) {}

  async syncNotice(input: INoticeCreate, tx: PrismaTransactionClient) {
    return input;
  }
}
`,
  );
  commitAll(workspace, "base");

  writeFile(
    workspace,
    SERVICE_PATH,
    `
export class NoticeService {
  constructor(private readonly noticeRepository: NoticeRepository) {}

  async syncNotice(input: INoticeCreate, tx: PrismaTransactionClient) {
    return this.noticeRepository.createTx(input, tx);
  }
}
`,
  );

  const violations = runGuard(workspace);

  assert.equal(violations.length, 1);
  assert.equal(violations[0].kind, "service-base-repository-write");
  assert.equal(violations[0].detected, "this.noticeRepository.createTx");
});

test("fails when a changed BaseRepository subclass method calls this patch with bracket access", () => {
  const workspace = makeGitWorkspace();
  writeBaseRepositorySubclass(workspace);
  commitAll(workspace, "base");

  writeFile(
    workspace,
    REPOSITORY_PATH,
    `
export class NoticeRepository extends BaseSingleTableRepository<MNotice, INoticeCreate, NoticeQuery> {
  async normalizeNotice(id: number) {
    return this["patch"]({ id }, notice => notice);
  }
}
`,
  );

  const violations = runGuard(workspace);

  assert.equal(violations.length, 1);
  assert.equal(violations[0].kind, "repository-base-repository-write");
  assert.equal(violations[0].detected, 'this["patch"]');
});

test("passes when a service calls a domain command implemented on the repository", () => {
  const workspace = makeGitWorkspace();
  writeFile(
    workspace,
    REPOSITORY_PATH,
    `
export class NoticeRepository extends BaseSingleTableRepository<MNotice, INoticeCreate, NoticeQuery> {
  async createNotice(input: INoticeCreate) {
    return this.txHost.tx.notice.create({ data: input });
  }
}
`,
  );
  writeFile(
    workspace,
    SERVICE_PATH,
    `
export class NoticeService {
  constructor(private readonly noticeRepository: NoticeRepository) {}

  async syncNotice(input: INoticeCreate) {
    return input;
  }
}
`,
  );
  commitAll(workspace, "base");

  writeFile(
    workspace,
    SERVICE_PATH,
    `
export class NoticeService {
  constructor(private readonly noticeRepository: NoticeRepository) {}

  async syncNotice(input: INoticeCreate) {
    return this.noticeRepository.createNotice(input);
  }
}
`,
  );

  assert.deepEqual(runGuard(workspace), []);
});

test("passes when a service calls a same-named method on a non-BaseRepository class", () => {
  const workspace = makeGitWorkspace();
  writeFile(
    workspace,
    CUSTOM_REPOSITORY_PATH,
    `
export class FundingRepository {
  async put(id: number, body: unknown) {
    return { id, body };
  }
}
`,
  );
  writeFile(
    workspace,
    SERVICE_PATH,
    `
export class FundingService {
  constructor(private readonly fundingRepository: FundingRepository) {}

  async updateFunding(id: number, body: unknown) {
    return body;
  }
}
`,
  );
  commitAll(workspace, "base");

  writeFile(
    workspace,
    SERVICE_PATH,
    `
export class FundingService {
  constructor(private readonly fundingRepository: FundingRepository) {}

  async updateFunding(id: number, body: unknown) {
    return this.fundingRepository.put(id, body);
  }
}
`,
  );

  assert.deepEqual(runGuard(workspace), []);
});

test("passes when a BaseRepository subclass overrides the same-named method", () => {
  const workspace = makeGitWorkspace();
  writeFile(
    workspace,
    REPOSITORY_PATH,
    `
export class NoticeRepository extends BaseSingleTableRepository<MNotice, INoticeCreate, NoticeQuery> {
  async create(input: INoticeCreate) {
    return this.txHost.tx.notice.create({ data: input });
  }
}
`,
  );
  writeFile(
    workspace,
    SERVICE_PATH,
    `
export class NoticeService {
  constructor(private readonly noticeRepository: NoticeRepository) {}

  async syncNotice(input: INoticeCreate) {
    return input;
  }
}
`,
  );
  commitAll(workspace, "base");

  writeFile(
    workspace,
    SERVICE_PATH,
    `
export class NoticeService {
  constructor(private readonly noticeRepository: NoticeRepository) {}

  async syncNotice(input: INoticeCreate) {
    return this.noticeRepository.create(input);
  }
}
`,
  );

  assert.deepEqual(runGuard(workspace), []);
});

test("passes when untouched legacy BaseRepository calls remain", () => {
  const workspace = makeGitWorkspace();
  writeBaseRepositorySubclass(workspace);
  writeFile(
    workspace,
    SERVICE_PATH,
    `
export class NoticeService {
  constructor(private readonly noticeRepository: NoticeRepository) {}

  async syncNotice(input: INoticeCreate) {
    return this.noticeRepository.create(input);
  }
}
`,
  );
  commitAll(workspace, "base");

  writeFile(
    workspace,
    SERVICE_PATH,
    `
export class NoticeService {
  constructor(private readonly noticeRepository: NoticeRepository) {}

  async syncNotice(input: INoticeCreate) {
    return this.noticeRepository.create(input);
  }

  label() {
    return "notice";
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

  return findChangedBaseRepositoryViolations({
    changedFiles: parseChangedFileLineMap(diff),
    repoRoot: workspace,
  });
}

function makeGitWorkspace() {
  const workspace = fs.mkdtempSync(
    path.join(os.tmpdir(), "base-repository-guard-"),
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

function writeBaseRepositorySubclass(workspace) {
  writeFile(
    workspace,
    REPOSITORY_PATH,
    `
export class NoticeRepository extends BaseSingleTableRepository<MNotice, INoticeCreate, NoticeQuery> {
  async findNotice(id: number) {
    return this.txHost.tx.notice.findFirst({ where: { id } });
  }
}
`,
  );
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
