import { ExecutionContext, Global, Module } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Test, TestingModule } from "@nestjs/testing";
import { TransactionHost } from "@nestjs-cls/transactional";
import { defer, lastValueFrom } from "rxjs";

import { CLOCK } from "@sparcs-clubs/api/common/clock/clock";
import { ClockModule } from "@sparcs-clubs/api/common/clock/clock.module";
import { RandomModule } from "@sparcs-clubs/api/common/random/random.module";
import { TransactionModule } from "@sparcs-clubs/api/common/transaction/transaction.module";
import { AppConfigService } from "@sparcs-clubs/api/config/app-config.service";
import { AuthModule } from "@sparcs-clubs/api/feature/auth/auth.module";
import { SsoLoginDiagnosticInterceptor } from "@sparcs-clubs/api/feature/auth/controller/sso-login-diagnostic.interceptor";
import { Request } from "@sparcs-clubs/api/feature/auth/dto/auth.dto";
import { AuthRepository } from "@sparcs-clubs/api/feature/auth/repository/auth.repository";
import { SsoLoginFailureRepository } from "@sparcs-clubs/api/feature/auth/repository/sso-login-failure/sso-login-failure.repository";
import { AuthService } from "@sparcs-clubs/api/feature/auth/service/auth.service";
import { SsoClientService } from "@sparcs-clubs/api/feature/auth/service/sso-client.service";
import { SsoLoginFailureService } from "@sparcs-clubs/api/feature/auth/service/sso-login-failure.service";
import UserPublicService from "@sparcs-clubs/api/feature/user/service/user.public.service";
import { PrismaService } from "@sparcs-clubs/api/prisma/prisma.service";

import { clearDatabase, closeDatabase } from "./setup";

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

@Global()
@Module({
  providers: [
    {
      provide: AppConfigService,
      useValue: {
        isLocal: false,
        jwtSecret: "test-secret",
        refreshTokenSecretKey: "test-refresh-secret",
        accessTokenSecretKey: "test-access-secret",
        accessTokenExpiresInMs: 1000,
        refreshTokenExpiresInMs: 2000,
      },
    },
  ],
  exports: [AppConfigService],
})
class TestConfigModule {}

// Real Auth/User/Semester modules and the production Prisma timezone proxy.
describe("SSO failure logging with MySQL", () => {
  let module: TestingModule;
  let prisma: PrismaService;
  const now = new Date("2026-09-15T08:29:16.000Z");
  const sso = { getUserInfo: jest.fn(), getLoginParams: jest.fn() };
  let tokenSequence = 0;
  const jwt = {
    sign: jest.fn(() => {
      tokenSequence += 1;
      return `private-token-${tokenSequence}`;
    }),
  };
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
            module
              .get(AuthService)
              .getAuthSignInCallback(
                query,
                req.session,
                req.ssoLoginDiagnostic,
              ),
          ),
      }),
    );
  }

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        TestConfigModule,
        ClockModule,
        RandomModule,
        TransactionModule,
        AuthModule,
      ],
    })
      .overrideProvider(CLOCK)
      .useValue({ now: () => now, endOfToday: () => now })
      .overrideProvider(SsoClientService)
      .useValue(sso)
      .overrideProvider(JwtService)
      .useValue(jwt)
      .compile();
    await module.init();
    prisma = module.get(PrismaService);
  });
  beforeEach(async () => {
    jest.restoreAllMocks();
    sso.getUserInfo.mockReset().mockResolvedValue(profile());
    jwt.sign.mockClear();
    await clearDatabase();
    await prisma.semesterD.create({
      data: {
        year: 2026,
        name: "가을",
        startTerm: new Date("2026-09-01"),
        endTerm: new Date("2027-03-01"),
      },
    });
  });
  afterAll(async () => {
    await module?.close();
    await closeDatabase();
  });

  it("commits the successful login once with no failure row", async () => {
    await expect(signIn()).resolves.toMatchObject({
      next: "/welcome",
      isKaistIamLogin: true,
    });
    expect(await prisma.user.count()).toBe(1);
    expect(await prisma.student.count()).toBe(1);
    expect(await prisma.studentT.count()).toBe(1);
    expect(await prisma.authActivatedRefreshTokens.count()).toBe(1);
    expect(await prisma.authSsoLoginFailureLog.count()).toBe(0);
  });

  it.each(["first login", "existing degree"])(
    "preserves the combined master's-doctoral degree through %s and token refresh",
    async mode => {
      const combinedProfile = {
        ...profile(),
        kaist_v2_info: {
          ...profile().kaist_v2_info,
          std_no: "20268083",
          std_prog_code: "7",
        },
      };
      if (mode === "existing degree") {
        sso.getUserInfo.mockResolvedValue({
          ...combinedProfile,
          kaist_v2_info: {
            ...combinedProfile.kaist_v2_info,
            std_prog_code: "2",
          },
        });
        await signIn();
        expect(await prisma.studentT.findFirst()).toMatchObject({
          studentEnum: 3,
        });
      }
      sso.getUserInfo.mockResolvedValue(combinedProfile);
      await signIn();
      const user = await prisma.user.findFirstOrThrow();
      const student = await prisma.student.findFirstOrThrow();
      expect(await prisma.studentT.findFirstOrThrow()).toMatchObject({
        studentId: student.id,
        studentEnum: 4,
      });
      const identity = await module
        .get(UserPublicService)
        .findLoginIdentity(user.id);
      expect(identity).toMatchObject({
        masterDoctor: { id: student.id, number: 20268083 },
      });
      expect(identity).not.toHaveProperty("doctor");
      expect(identity).not.toHaveProperty("undergraduate");
      const refreshed = await module.get(AuthService).postAuthRefresh(identity);
      expect(Object.keys(refreshed.accessToken)).toEqual(["masterDoctor"]);
      expect(jwt.sign).toHaveBeenLastCalledWith(
        expect.objectContaining({
          type: "masterDoctor",
          studentId: student.id,
          studentNumber: 20268083,
        }),
        expect.any(Object),
      );
      expect(await prisma.authSsoLoginFailureLog.count()).toBe(0);
    },
  );

  it.each(["classification", "token-store"])(
    "rolls back login writes and keeps the %s failure",
    async mode => {
      if (mode === "classification") {
        sso.getUserInfo.mockResolvedValue({
          ...profile(),
          kaist_v2_info: { ...profile().kaist_v2_info, std_prog_code: 1 },
        });
      } else {
        jest
          .spyOn(module.get(AuthRepository), "createRefreshTokenRecord")
          .mockRejectedValue(new Error("private-token-1"));
      }
      await expect(signIn()).rejects.toThrow();
      expect(await prisma.user.count()).toBe(0);
      expect(await prisma.student.count()).toBe(0);
      expect(await prisma.studentT.count()).toBe(0);
      expect(await prisma.authActivatedRefreshTokens.count()).toBe(0);
      const logs = await prisma.authSsoLoginFailureLog.findMany();
      expect(logs).toHaveLength(1);
      expect(logs[0]).toMatchObject({
        occurredAt: now,
        stage:
          mode === "classification"
            ? "db.current-degree.resolve"
            : "refresh_token_store",
      });
      expect(logs[0].userId).toBeGreaterThan(0);
      expect(JSON.stringify(logs)).not.toContain("private-code");
      expect(JSON.stringify(logs)).not.toContain("private-state");
    },
  );

  it("persists a failure while a parent transaction is still active, then rolls the parent back", async () => {
    const failure = new Error("parent rollback");
    await expect(
      module.get(TransactionHost).withTransaction(async () => {
        const row = await module
          .get(TransactionHost)
          .tx.user.create({ data: { sid: "rolled-back", name: "학생" } });
        await module.get(SsoLoginFailureService).record({
          occurredAt: now,
          traceId: "f91ba6a8-d4d9-4903-a72b-83c9ba79e828",
          stage: "test-parent-rollback",
          httpStatus: 500,
          errorName: "Error",
          errorMessage: "parent rollback",
          method: "GET",
          path: "/auth/sign-in/callback",
          userId: row.id,
          diagnostics: {},
        });
        throw failure;
      }),
    ).rejects.toBe(failure);
    expect(await prisma.user.count()).toBe(0);
    expect(await prisma.authSsoLoginFailureLog.count()).toBe(1);
  });

  it("keeps the original error if failure storage also fails", async () => {
    const failure = new Error("original SSO failure");
    sso.getUserInfo.mockRejectedValue(failure);
    jest
      .spyOn(module.get(SsoLoginFailureRepository), "create")
      .mockRejectedValue(new Error("log insert failed"));
    await expect(signIn()).rejects.toBe(failure);
    expect(await prisma.authSsoLoginFailureLog.count()).toBe(0);
  });

  it("handles simultaneous first login for the same new account", async () => {
    await Promise.all([signIn(), signIn()]);
    expect(await prisma.user.count()).toBe(1);
    expect(await prisma.student.count()).toBe(1);
    expect(await prisma.studentT.count()).toBe(1);
    expect(await prisma.authActivatedRefreshTokens.count()).toBe(2);
    expect(await prisma.authSsoLoginFailureLog.count()).toBe(0);
  });

  it("handles repeated concurrent login without duplicating the user or academic term", async () => {
    await signIn();
    await Promise.all([signIn(), signIn()]);
    expect(await prisma.user.count()).toBe(1);
    expect(await prisma.student.count()).toBe(1);
    expect(await prisma.studentT.count()).toBe(1);
    expect(await prisma.authActivatedRefreshTokens.count()).toBe(3);
    expect(await prisma.authSsoLoginFailureLog.count()).toBe(0);
  });
});
