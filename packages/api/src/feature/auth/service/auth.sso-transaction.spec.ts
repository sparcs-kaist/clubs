import { ExecutionContext } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Test, TestingModule } from "@nestjs/testing";
import { TransactionHost } from "@nestjs-cls/transactional";
import { defer, lastValueFrom } from "rxjs";

import { CLOCK } from "@sparcs-clubs/api/common/clock/clock";
import { RANDOM_GENERATOR } from "@sparcs-clubs/api/common/random/random-generator";
import { TransactionModule } from "@sparcs-clubs/api/common/transaction/transaction.module";
import { AppConfigService } from "@sparcs-clubs/api/config/app-config.service";
import { UserSsoLoginRepository } from "@sparcs-clubs/api/feature/user/repository/sso-login/user-sso-login.repository";
import { PrismaService } from "@sparcs-clubs/api/prisma/prisma.service";

import { SsoLoginDiagnosticInterceptor } from "../controller/sso-login-diagnostic.interceptor";
import { Request } from "../dto/auth.dto";
import { AuthRepository } from "../repository/auth.repository";
import { AuthExchangeLoginRepository } from "../repository/exchange-login/auth-exchange-login.repository";
import { SsoLoginFailureRepository } from "../repository/sso-login-failure/sso-login-failure.repository";
import { AuthService } from "./auth.service";
import { SsoClientService } from "./sso-client.service";

jest.mock("@sparcs-clubs/api/env", () => ({ env: { NODE_ENV: "test" } }));
jest.mock("@sparcs-clubs/api/common/util/logger", () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe("SSO login transaction with real transaction providers", () => {
  let module: TestingModule;
  let service: AuthService;
  const now = new Date("2026-09-15T08:29:16.000Z");
  const semester = {
    id: 7,
    startTerm: new Date("2026-09-01"),
    endTerm: new Date("2027-03-01"),
  };
  const emptyState = () => ({
    users: [] as Record<string, unknown>[],
    students: [] as Record<string, unknown>[],
    terms: [] as Record<string, unknown>[],
    tokens: [] as Record<string, unknown>[],
  });
  let committed = emptyState();
  let failTokenStore = false;
  let failTokenSign = false;
  const attempted: string[] = [];
  const sso = { getUserInfo: jest.fn() };
  const profile = () => ({
    uid: "sso-uid",
    sid: "sso-sid",
    kaist_info: {},
    kaist_v2_info: {
      std_no: "20268001",
      std_prog_code: "1",
      socps_cd: "S",
      std_status_kor: "재학",
      email: "student@example.com",
      user_nm: "학생",
      std_dept_id: "4423",
    },
  });
  const database = {
    authSsoLoginFailureLog: {
      create: jest.fn(async ({ data }) => {
        expect(module.get(TransactionHost).isTransactionActive()).toBe(false);
        return data;
      }),
    },
    $transaction: jest.fn(
      async (callback: (tx: unknown) => Promise<unknown>) => {
        const pending = emptyState();
        const store = (
          table: keyof typeof pending,
          data: Record<string, unknown>,
          id: number,
        ) => {
          expect(module.get(TransactionHost).isTransactionActive()).toBe(true);
          attempted.push(table);
          const row = { ...data, id, createdAt: now, deletedAt: null };
          pending[table].push(row);
          return row;
        };
        const result = await callback({
          user: {
            upsert: async ({ create }) => store("users", create, 42),
            findMany: async () => pending.users,
          },
          student: {
            upsert: async ({ create }) => store("students", create, 12),
            findMany: async () => pending.students,
          },
          studentT: {
            upsert: async ({ create }) => store("terms", create, 91),
            findMany: async () => pending.terms,
          },
          semesterD: { findMany: async () => [semester] },
          executive: {
            updateMany: async () => ({ count: 0 }),
            findMany: async () => [],
          },
          authActivatedRefreshTokens: {
            create: async ({ data }) => {
              if (failTokenStore) throw new Error("private-refresh-token");
              return store("tokens", data, 101);
            },
          },
        });
        committed = pending;
        return result;
      },
    ),
  };

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [TransactionModule],
      providers: [
        AuthService,
        AuthRepository,
        UserSsoLoginRepository,
        AuthExchangeLoginRepository,
        SsoLoginFailureRepository,
        SsoLoginDiagnosticInterceptor,
        { provide: SsoClientService, useValue: sso },
        {
          provide: JwtService,
          useValue: {
            sign: (payload: { type?: string }) => {
              if (failTokenSign) throw new Error("token signing failed");
              return payload.type
                ? "private-access-token"
                : "private-refresh-token";
            },
          },
        },
        { provide: CLOCK, useValue: { now: () => now, endOfToday: () => now } },
        {
          provide: RANDOM_GENERATOR,
          useValue: {
            uuid: () => "c9a390bf-e710-4ac7-800d-79015c1c3a54",
            hex: () => "fixed-state",
          },
        },
        {
          provide: AppConfigService,
          useValue: {
            isLocal: false,
            accessTokenExpiresInMs: 1000,
            refreshTokenExpiresInMs: 2000,
            accessTokenSecretKey: "access-secret",
            refreshTokenSecretKey: "refresh-secret",
          },
        },
      ],
    })
      .overrideProvider(PrismaService)
      .useValue(database)
      .compile();
    await module.init();
    service = module.get(AuthService);
  });
  beforeEach(() => {
    committed = emptyState();
    attempted.length = 0;
    failTokenStore = false;
    failTokenSign = false;
    jest.clearAllMocks();
    sso.getUserInfo.mockReset().mockResolvedValue(profile());
  });
  afterAll(async () => {
    await module?.close();
  });

  function signIn() {
    const query = { code: "private-code", state: "private-state" };
    const req = {
      query,
      headers: {},
      method: "GET",
      route: { path: "/auth/sign-in/callback" },
      session: { ssoState: query.state, next: "/welcome" },
    } as unknown as Request;
    const context = {
      switchToHttp: () => ({
        getRequest: () => req,
        getResponse: () => ({ setHeader: jest.fn(), statusCode: 200 }),
      }),
    } as unknown as ExecutionContext;
    return lastValueFrom(
      module.get(SsoLoginDiagnosticInterceptor).intercept(context, {
        handle: () =>
          defer(() =>
            service.getAuthSignInCallback(
              query,
              req.session,
              req.ssoLoginDiagnostic,
            ),
          ),
      }),
    );
  }

  it("commits user, student, academic term and refresh token together on success", async () => {
    await expect(signIn()).resolves.toMatchObject({
      next: "/welcome",
      isKaistIamLogin: true,
    });
    expect(database.$transaction).toHaveBeenCalledTimes(1);
    expect(committed.users).toEqual([
      expect.objectContaining({ id: 42, sid: "sso-sid" }),
    ]);
    expect(committed.students).toEqual([
      expect.objectContaining({ id: 12, userId: 42, number: 20268001 }),
    ]);
    expect(committed.terms).toEqual([
      expect.objectContaining({ studentId: 12, studentEnum: 2 }),
    ]);
    expect(committed.tokens).toEqual([
      expect.objectContaining({
        userId: 42,
        refreshToken: "private-refresh-token",
      }),
    ]);
    expect(database.authSsoLoginFailureLog.create).not.toHaveBeenCalled();
  });

  it.each([
    "db.current-degree.resolve",
    "access_token_issue",
    "refresh_token_store",
  ])(
    "rolls back mutations and records exactly one failure outside the transaction at %s",
    async stage => {
      if (stage === "db.current-degree.resolve") {
        sso.getUserInfo.mockResolvedValue({
          ...profile(),
          kaist_v2_info: { ...profile().kaist_v2_info, std_prog_code: 1 },
        });
      }
      failTokenSign = stage === "access_token_issue";
      failTokenStore = stage === "refresh_token_store";

      await expect(signIn()).rejects.toThrow();

      expect(database.$transaction).toHaveBeenCalledTimes(1);
      expect(attempted).toEqual(expect.arrayContaining(["users", "students"]));
      expect(committed).toEqual(emptyState());
      expect(database.authSsoLoginFailureLog.create).toHaveBeenCalledTimes(1);
      const log = database.authSsoLoginFailureLog.create.mock.calls[0][0].data;
      expect(log).toMatchObject({ stage, userId: 42, studentId: 12 });
      expect(JSON.stringify(log)).not.toContain("private-refresh-token");
    },
  );

  it("does not begin a database transaction for an external SSO failure", async () => {
    const failure = new Error("upstream unavailable");
    sso.getUserInfo.mockRejectedValue(failure);

    await expect(signIn()).rejects.toBe(failure);

    expect(database.$transaction).not.toHaveBeenCalled();
    expect(committed).toEqual(emptyState());
    expect(database.authSsoLoginFailureLog.create).toHaveBeenCalledTimes(1);
    expect(
      database.authSsoLoginFailureLog.create.mock.calls[0][0].data.stage,
    ).toBe("sso_request");
  });
});
