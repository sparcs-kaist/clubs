import { Test, TestingModule } from "@nestjs/testing";
import { TransactionHost } from "@nestjs-cls/transactional";

import { TransactionModule } from "@sparcs-clubs/api/common/transaction/transaction.module";
import { PrismaService } from "@sparcs-clubs/api/prisma/prisma.service";

import { SsoLoginFailureRepository } from "../repository/sso-login-failure/sso-login-failure.repository";
import { SsoLoginFailureService } from "./sso-login-failure.service";

jest.mock("@sparcs-clubs/api/env", () => ({ env: { NODE_ENV: "test" } }));

describe("SSO failure recording transaction propagation", () => {
  let module: TestingModule;
  let service: SsoLoginFailureService;
  const rootCreate = jest.fn();
  const transactionCreate = jest.fn();
  const database = {
    authSsoLoginFailureLog: { create: rootCreate },
    $transaction: jest.fn(async callback =>
      callback({
        authSsoLoginFailureLog: { create: transactionCreate },
      }),
    ),
  };
  const data = {
    occurredAt: new Date("2026-09-15T08:29:16Z"),
    traceId: "7e5b4335-03e2-430f-b535-d8e688465883",
    stage: "db.current-degree.resolve",
    httpStatus: 400,
    errorName: "HttpException",
    errorMessage: "academic information unavailable",
    method: "GET",
    path: "/auth/sign-in/callback",
    diagnostics: {},
  };

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [TransactionModule],
      providers: [SsoLoginFailureService, SsoLoginFailureRepository],
    })
      .overrideProvider(PrismaService)
      .useValue(database)
      .compile();
    await module.init();
    service = module.get(SsoLoginFailureService);
  });
  beforeEach(() => {
    jest.clearAllMocks();
    rootCreate.mockReset().mockImplementation(async ({ data: row }) => {
      expect(module.get(TransactionHost).isTransactionActive()).toBe(false);
      return row;
    });
  });
  afterAll(async () => {
    await module.close();
  });

  it("suspends an active parent transaction, records once, and restores it before rollback", async () => {
    const host = module.get(TransactionHost);
    const original = new Error("login failed");
    await expect(
      host.withTransaction(async () => {
        expect(host.isTransactionActive()).toBe(true);
        await service.record(data);
        expect(host.isTransactionActive()).toBe(true);
        throw original;
      }),
    ).rejects.toBe(original);
    expect(rootCreate).toHaveBeenCalledTimes(1);
    expect(transactionCreate).not.toHaveBeenCalled();
    expect(database.$transaction).toHaveBeenCalledTimes(1);
  });

  it("uses one autocommit insert when there is no parent transaction", async () => {
    await service.record(data);
    expect(rootCreate).toHaveBeenCalledWith({ data });
    expect(database.$transaction).not.toHaveBeenCalled();
  });

  it("restores the parent context even if the log insert fails", async () => {
    const failure = new Error("log storage unavailable");
    rootCreate.mockRejectedValue(failure);
    const host = module.get(TransactionHost);
    await host.withTransaction(async () => {
      await expect(service.record(data)).rejects.toBe(failure);
      expect(host.isTransactionActive()).toBe(true);
    });
    expect(transactionCreate).not.toHaveBeenCalled();
  });
});
