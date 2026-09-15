import "@clubs/interface/api/user/type/user.type";
import {
  ExecutionContext,
  HttpException,
  INestApplication,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Test } from "@nestjs/testing";
import { lastValueFrom, throwError } from "rxjs";
import request from "supertest";

import { CLOCK } from "@sparcs-clubs/api/common/clock/clock";
import { RANDOM_GENERATOR } from "@sparcs-clubs/api/common/random/random-generator";
import { TransactionModule } from "@sparcs-clubs/api/common/transaction/transaction.module";
import {
  HttpExceptionFilter,
  ZodErrorFilter,
} from "@sparcs-clubs/api/common/util/exception.filter";
import logger from "@sparcs-clubs/api/common/util/logger";
import { AppConfigService } from "@sparcs-clubs/api/config/app-config.service";
import { PrismaService } from "@sparcs-clubs/api/prisma/prisma.service";

import { AuthRepository } from "../repository/auth.repository";
import { SsoLoginFailureRepository } from "../repository/sso-login-failure/sso-login-failure.repository";
import { AuthService } from "../service/auth.service";
import { SsoClientService } from "../service/sso-client.service";
import { AuthController } from "./auth.controller";
import { SsoLoginDiagnosticInterceptor } from "./sso-login-diagnostic.interceptor";

jest.mock("@sparcs-clubs/api/prisma/prisma.service", () => ({
  PrismaService: class {},
}));
jest.mock("@sparcs-clubs/api/common/util/logger", () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe("SSO failure logging HTTP boundary", () => {
  let app: INestApplication;
  const now = new Date("2026-09-15T08:29:16.000Z");
  const clock = { now: () => now, endOfToday: () => now };
  const random = {
    uuid: () => "a3796476-96a3-4b24-bd02-96ad442af047",
    hex: () => "generated-state",
  };
  const config = {
    isLocal: false,
    ssoSecretKey: "client-private-secret",
    secretKey: "session-private-secret",
    jwtSecret: "jwt-private-secret",
    accessTokenSecretKey: "access-private-secret",
    refreshTokenSecretKey: "refresh-private-secret",
    accessTokenExpiresInMs: 1000,
    refreshTokenExpiresInMs: 2000,
  };
  const repository = {
    findOrCreateUser: jest.fn(),
    createRefreshTokenRecord: jest.fn(),
  };
  const logs = { create: jest.fn() };
  const sso = { getUserInfo: jest.fn(), getLoginParams: jest.fn() };
  const jwt = { sign: jest.fn() };
  let session: { ssoState?: string; next?: string } | undefined;
  const profile = () => ({
    sid: "test-sid",
    uid: "test-uid",
    kaist_info: {},
    kaist_v2_info: {
      std_no: "20268001",
      std_prog_code: 1,
      socps_cd: "S",
      std_status_kor: "재학",
      email: "student@example.com",
      user_nm: "학생",
      std_dept_id: "4423",
    },
  });
  const callback = (
    query = { code: "private-code", state: "expected-state" },
  ) => request(app.getHttpServer()).get("/auth/sign-in/callback").query(query);

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [TransactionModule],
      controllers: [AuthController],
      providers: [
        AuthService,
        SsoLoginDiagnosticInterceptor,
        { provide: AuthRepository, useValue: repository },
        { provide: SsoLoginFailureRepository, useValue: logs },
        { provide: SsoClientService, useValue: sso },
        { provide: JwtService, useValue: jwt },
        { provide: AppConfigService, useValue: config },
        { provide: CLOCK, useValue: clock },
        { provide: RANDOM_GENERATOR, useValue: random },
      ],
    })
      .overrideProvider(PrismaService)
      .useValue({
        $transaction: async (
          runTransaction: (tx: object) => Promise<unknown>,
        ) => runTransaction({}),
      })
      .compile();
    app = module.createNestApplication();
    app.useLogger(false);
    app.use((req, _res, next) => {
      req.session = session;
      next();
    });
    app.useGlobalFilters(
      new ZodErrorFilter(clock),
      new HttpExceptionFilter(clock),
    );
    await app.listen(0, "127.0.0.1");
  });

  beforeEach(() => {
    jest.resetAllMocks();
    session = { ssoState: "expected-state", next: "/welcome" };
    config.isLocal = false;
    sso.getUserInfo.mockResolvedValue(profile());
    sso.getLoginParams.mockReturnValue({
      url: "https://sso.example.test",
      state: "generated-state",
    });
    repository.findOrCreateUser.mockResolvedValue({
      id: 42,
      sid: "test-sid",
      email: "student@example.com",
      name: "학생",
      master: { id: 12, number: 20268001 },
    });
    repository.createRefreshTokenRecord.mockResolvedValue(true);
    jwt.sign.mockReturnValue("private-issued-token");
    logs.create.mockResolvedValue(undefined);
  });
  afterAll(async () => {
    await app.close();
  });

  it("preserves successful sign-in, cookies and redirect without failure rows", async () => {
    await request(app.getHttpServer()).get("/auth/sign-in").expect(200);
    session.ssoState = "expected-state";
    const response = await callback().expect(302);
    expect(response.headers.location).toBe("/");
    expect(response.headers["set-cookie"]).toHaveLength(3);
    expect(logs.create).not.toHaveBeenCalled();
  });

  it.each([undefined, "mismatched-state"])(
    "records the early state failure (%s) once",
    async state => {
      session.ssoState = state;
      const response = await callback().expect(302);
      expect(response.headers.location).toContain("/errors/not-iam-login");
      expect(logs.create).toHaveBeenCalledTimes(1);
      expect(logs.create.mock.calls[0][0]).toMatchObject({
        occurredAt: now,
        stage: "session_validation",
        errorName: "InvalidSsoState",
        httpStatus: 401,
      });
      expect(sso.getUserInfo).not.toHaveBeenCalled();
    },
  );

  it("captures request pipe rejection before service execution", async () => {
    await callback({ code: "private-code", state: undefined }).expect(400);
    expect(logs.create).toHaveBeenCalledTimes(1);
    expect(logs.create.mock.calls[0][0]).toMatchObject({
      stage: "request_validation",
      errorName: "ZodError",
      httpStatus: 400,
      path: "/auth/sign-in/callback",
      method: "GET",
    });
    expect(sso.getUserInfo).not.toHaveBeenCalled();
  });

  it("records missing session and initial login parameter failures", async () => {
    session = undefined;
    await callback().expect(500);
    expect(logs.create.mock.calls[0][0].stage).toBe("session_validation");
    session = {};
    sso.getLoginParams.mockImplementation(() => {
      throw new Error("unavailable");
    });
    await request(app.getHttpServer()).get("/auth/sign-in").expect(500);
    expect(logs.create.mock.calls[1][0].stage).toBe("sso_login_params");
  });

  it.each([
    ["MissingSsoProfile", { sid: "test-sid" }],
    ["MissingSsoProfile", { ...profile(), sid: "" }],
    [
      "InvalidSsoFields",
      {
        ...profile(),
        kaist_v2_info: { ...profile().kaist_v2_info, email: "invalid" },
      },
    ],
  ])("captures early profile failure %s", async (errorName, input) => {
    sso.getUserInfo.mockResolvedValue(input);
    await callback().expect(302);
    expect(logs.create).toHaveBeenCalledTimes(1);
    expect(logs.create.mock.calls[0][0].errorName).toBe(errorName);
    expect(repository.findOrCreateUser).not.toHaveBeenCalled();
  });

  it("keeps the numeric program code and sanitized DB context on academic failure", async () => {
    repository.findOrCreateUser.mockImplementation(async (...args) => {
      const diagnostic = args[9];
      diagnostic.stage = "db.current-degree.resolve";
      diagnostic.userId = 42;
      diagnostic.studentId = 12;
      diagnostic.db = {
        currentStudentTerms: { queriedAt: now, studentIds: [12], rows: [] },
      };
      throw new HttpException(
        "교환학생의 학적 정보를 추적할 수 없습니다. 관리자에게 문의해주세요.",
        400,
      );
    });
    const response = await callback().expect(400);
    expect(logs.create).toHaveBeenCalledTimes(1);
    expect(response.headers["x-sso-login-trace-id"]).toBe(random.uuid());
    expect(logs.create.mock.calls[0][0]).toMatchObject({
      userId: 42,
      studentId: 12,
      stage: "db.current-degree.resolve",
      httpStatus: 400,
      diagnostics: {
        data: {
          sso: {
            profile: {
              kaist_v2_info: {
                fields: {
                  std_prog_code: { present: true, type: "number", value: 1 },
                },
              },
            },
          },
          db: {
            currentStudentTerms: { queriedAt: now.toISOString(), rows: [] },
          },
        },
      },
    });
  });

  it("records a V2 parse failure swallowed by the service fallback", async () => {
    sso.getUserInfo.mockResolvedValue({
      ...profile(),
      kaist_v2_info: "{private-code",
    });
    await callback().expect(302);
    expect(logs.create).toHaveBeenCalledTimes(1);
    expect(logs.create.mock.calls[0][0]).toMatchObject({
      stage: "sso_parse",
      errorName: "MissingSsoUserInfo",
      diagnostics: {
        data: {
          sso: {
            serviceParseError: "kaist_v2_info",
            profile: {
              kaist_v2_info: { type: "string", state: "parse_failed" },
            },
          },
        },
      },
    });
    expect(JSON.stringify(logs.create.mock.calls[0][0])).not.toContain(
      "private-code",
    );
  });

  it.each([true, false])(
    "preserves local fallback with valid fields=%s",
    async valid => {
      Object.assign(config, {
        isLocal: true,
        userV2StdNo: "20260001",
        userV2UserNm: "테스트 학생",
        userV2Email: valid ? "local@example.com" : "invalid",
        userV2SocpsCd: "S",
        userV2StdDeptId: "4423",
        userV2KaistUid: "local-uid",
        userV2UserId: "local-id",
      });
      sso.getUserInfo.mockResolvedValue({ ...profile(), kaist_v2_info: null });
      const response = await callback().expect(302);
      if (valid) {
        expect(response.headers.location).toBe("/welcome");
        expect(logs.create).not.toHaveBeenCalled();
      } else {
        expect(response.headers.location).toBe(
          "http://localhost:3000/errors/not-iam-login",
        );
        expect(logs.create.mock.calls[0][0]).toMatchObject({
          stage: "local_profile_validation",
          errorName: "InvalidLocalSsoFields",
        });
      }
    },
  );

  it("keeps an early failure redirect when the log database is unavailable", async () => {
    logs.create.mockRejectedValue(
      new Error("connection password=private-db-secret"),
    );
    session.ssoState = "mismatch";
    await callback()
      .expect(302)
      .expect("Location", "https://clubs.sparcs.org/errors/not-iam-login");
    expect(logs.create).toHaveBeenCalledTimes(1);
    expect(
      JSON.stringify((logger.error as jest.Mock).mock.calls),
    ).not.toContain("private-db-secret");
  });

  it("removes authentication values from error name/message/stack and metadata", async () => {
    const error = new Error(
      "private-code expected-state client-private-secret Authorization: Bearer header-secret password=unseen-password https://x.test/?code=unknown-code&state=unknown-state",
    );
    error.name = "Error-private-code";
    sso.getUserInfo.mockRejectedValue(error);
    await callback()
      .set("Authorization", "Bearer header-secret")
      .set("Cookie", "session=cookie-secret")
      .set("User-Agent", "agent private-code")
      .expect(500);
    const persisted = JSON.stringify(logs.create.mock.calls[0][0]);
    [
      "private-code",
      "expected-state",
      "client-private-secret",
      "header-secret",
      "cookie-secret",
      "unseen-password",
      "unknown-code",
      "unknown-state",
    ].forEach(secret => expect(persisted).not.toContain(secret));
    expect(persisted).toContain("[REDACTED]");
  });

  it.each(["sign", "store", "false"])(
    "captures token failure at %s without tokens",
    async mode => {
      if (mode === "sign")
        jwt.sign.mockImplementation(() => {
          throw new Error("access-private-secret");
        });
      if (mode === "store")
        repository.createRefreshTokenRecord.mockRejectedValue(
          new Error("private-issued-token"),
        );
      if (mode === "false")
        repository.createRefreshTokenRecord.mockResolvedValue(false);
      await callback().expect(500);
      expect(logs.create).toHaveBeenCalledTimes(1);
      expect(logs.create.mock.calls[0][0].stage).toBe(
        mode === "sign" ? "access_token_issue" : "refresh_token_store",
      );
      expect(JSON.stringify(logs.create.mock.calls[0][0])).not.toContain(
        "private-issued-token",
      );
    },
  );

  it("keeps the same exception and a minimal fallback when storing the log fails", async () => {
    logs.create.mockRejectedValue(new Error("DB password=must-not-log"));
    const interceptor = app.get(SsoLoginDiagnosticInterceptor);
    const req = {
      query: {},
      headers: {},
      session: {},
      method: "GET",
      route: { path: "/auth/sign-in" },
    };
    const context = {
      switchToHttp: () => ({
        getRequest: () => req,
        getResponse: () => ({ setHeader: jest.fn(), statusCode: 200 }),
      }),
    } as unknown as ExecutionContext;
    const original = new HttpException("original", 403);
    await expect(
      lastValueFrom(
        interceptor.intercept(context, {
          handle: () => throwError(() => original),
        }),
      ),
    ).rejects.toBe(original);
    expect(logs.create).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining("SSO failure log unavailable"),
    );
    expect(
      JSON.stringify((logger.error as jest.Mock).mock.calls),
    ).not.toContain("must-not-log");
  });
});
