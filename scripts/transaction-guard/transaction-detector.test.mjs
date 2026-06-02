import assert from "node:assert/strict";
import test from "node:test";

import {
  buildRepositoryCommandIndex,
  findTransactionGuardNodes,
} from "./transaction-detector.mjs";

test("detects manual transaction patterns in feature code", () => {
  const sourceText = `
import { Prisma } from "@prisma/client";
import { PrismaTransactionClient } from "@sparcs-clubs/api/common/base/base.repository";

class ExampleService {
  async create(tx: Prisma.TransactionClient) {
    await this.prisma.$transaction(async trx => trx.user.create({ data: {} }));
  }

  async patchTx() {
    return this.repository.withTransaction(async tx => tx.user.update({ data: {} }));
  }
}
`;

  const result = findTransactionGuardNodes({
    sourceText,
    filePath: "packages/api/src/feature/example/service/example.service.ts",
    repositoryCommandIndex: new Map(),
  });

  assert.deepEqual(
    result.nodes.map(node => node.kind),
    [
      "manual-transaction-type",
      "tx-parameter",
      "manual-transaction-type",
      "manual-transaction-call",
      "tx-suffix-method",
      "manual-transaction-call",
      "tx-parameter",
    ],
  );
});

test("flags repository command methods that write through root PrismaService", () => {
  const sourceText = `
class ExampleRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createSecretKey(secretKey: string) {
    return this.prisma.operationCommitteeSecretKey.create({
      data: { secretKey },
    });
  }

  async createWithTxHost(secretKey: string) {
    return this.txHost.tx.operationCommitteeSecretKey.create({
      data: { secretKey },
    });
  }
}
`;

  const result = findTransactionGuardNodes({
    sourceText,
    filePath:
      "packages/api/src/feature/operation-committee/repository/operation-committee.repository.ts",
    repositoryCommandIndex: new Map(),
  });

  assert.deepEqual(
    result.nodes.map(node => node.kind),
    ["root-prisma-in-repository-command"],
  );
  assert.equal(
    result.nodes[0].detected,
    "this.prisma.operationCommitteeSecretKey.create",
  );
});

test("requires @Transactional when a changed service method calls repository command methods", () => {
  const repositorySourceText = `
class ExampleRepository {
  async findSecretKey() {
    return this.txHost.tx.operationCommitteeSecretKey.findFirst();
  }

  async createSecretKey(secretKey: string) {
    return this.txHost.tx.operationCommitteeSecretKey.create({
      data: { secretKey },
    });
  }
}
`;
  const repositoryCommandIndex = buildRepositoryCommandIndex([
    {
      filePath:
        "packages/api/src/feature/operation-committee/repository/operation-committee.repository.ts",
      sourceText: repositorySourceText,
    },
  ]);
  const serviceSourceText = `
import { Injectable } from "@nestjs/common";

import { ExampleRepository } from "../repository/operation-committee.repository";

@Injectable()
class ExampleService {
  constructor(private readonly operationCommitteeRepository: ExampleRepository) {}

  async createSecretKey(secretKey: string) {
    return this.operationCommitteeRepository.createSecretKey(secretKey);
  }

  @Transactional()
  async createSecretKeyTransactionally(secretKey: string) {
    return this.operationCommitteeRepository.createSecretKey(secretKey);
  }

  async readSecretKey() {
    return this.operationCommitteeRepository.findSecretKey();
  }
}
`;

  const result = findTransactionGuardNodes({
    sourceText: serviceSourceText,
    filePath:
      "packages/api/src/feature/operation-committee/service/operation-committee.service.ts",
    repositoryCommandIndex,
  });

  assert.deepEqual(
    result.nodes.map(node => node.kind),
    ["service-command-without-transactional"],
  );
  assert.equal(
    result.nodes[0].detected,
    "operationCommitteeRepository.createSecretKey",
  );
});
