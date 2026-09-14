import { Test, TestingModule } from "@nestjs/testing";

import { CLOCK } from "@sparcs-clubs/api/common/clock/clock";
import { TransactionModule } from "@sparcs-clubs/api/common/transaction/transaction.module";
import { AppConfigService } from "@sparcs-clubs/api/config/app-config.service";
import UserPublicService from "@sparcs-clubs/api/feature/user/service/user.public.service";
import { PrismaService } from "@sparcs-clubs/api/prisma/prisma.service";

import { AuthRepository } from "../repository/auth.repository";
import { AuthExchangeLoginRepository } from "../repository/exchange-login/auth-exchange-login.repository";
import { AuthService } from "./auth.service";
import { ExchangeLoginService } from "./exchange-login.service";

jest.mock("@sparcs-clubs/api/env", () => ({ env: { NODE_ENV: "test" } }));

describe("exchange login transaction", () => {
  let module: TestingModule;
  let service: ExchangeLoginService;
  const committed: { logs: unknown[]; tokens: unknown[] } = {
    logs: [],
    tokens: [],
  };
  let failTokenWrite = false;
  const actor = { id: 1, email: "actor@kaist.ac.kr" };
  const target = {
    id: 2,
    name: "교수",
    sid: "target",
    email: "target@kaist.ac.kr",
  };

  beforeAll(async () => {
    const database = {
      $transaction: jest.fn(
        async (callback: (tx: unknown) => Promise<unknown>) => {
          const pending = { logs: [] as unknown[], tokens: [] as unknown[] };
          const result = await callback({
            authExchangeLoginLog: {
              create: async ({ data }: { data: unknown }) => {
                pending.logs.push(data);
                return data;
              },
            },
            authActivatedRefreshTokens: {
              create: async ({ data }: { data: unknown }) => {
                if (failTokenWrite) throw new Error("refresh storage failed");
                pending.tokens.push(data);
                return data;
              },
            },
          });
          committed.logs.push(...pending.logs);
          committed.tokens.push(...pending.tokens);
          return result;
        },
      ),
    };
    module = await Test.createTestingModule({
      imports: [TransactionModule],
      providers: [
        ExchangeLoginService,
        AuthExchangeLoginRepository,
        {
          provide: UserPublicService,
          useValue: {
            checkCurrentExecutiveById: jest.fn(),
            getExchangeLoginUserById: async (id: number) =>
              id === 1 ? actor : target,
          },
        },
        {
          provide: AuthRepository,
          useValue: { findUserById: async () => target },
        },
        {
          provide: AuthService,
          useValue: {
            getAccessToken: () => ({ professor: "target-access" }),
            getRefreshToken: () => "target-refresh",
          },
        },
        {
          provide: AppConfigService,
          useValue: { refreshTokenExpiresInMs: 60000 },
        },
        {
          provide: CLOCK,
          useValue: { now: () => new Date("2026-09-13T00:00:00Z") },
        },
      ],
    })
      .overrideProvider(PrismaService)
      .useValue(database)
      .compile();
    await module.init();
    service = module.get(ExchangeLoginService);
  });

  beforeEach(() => {
    committed.logs.length = 0;
    committed.tokens.length = 0;
    failTokenWrite = false;
  });

  afterAll(async () => {
    await module?.close();
  });

  it("commits the audit record and target refresh session together", async () => {
    await service.exchangeLogin(actor, 2);
    expect(committed.logs).toEqual([
      expect.objectContaining({ actorUserId: 1, targetUserId: 2 }),
    ]);
    expect(committed.tokens).toEqual([
      expect.objectContaining({ userId: 2, refreshToken: "target-refresh" }),
    ]);
  });

  it("rolls back the audit record when refresh storage fails", async () => {
    failTokenWrite = true;
    await expect(service.exchangeLogin(actor, 2)).rejects.toThrow(
      "refresh storage failed",
    );
    expect(committed).toEqual({ logs: [], tokens: [] });
  });
});
