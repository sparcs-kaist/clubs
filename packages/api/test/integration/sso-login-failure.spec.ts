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

  it.each([
    ["0", 1, "undergraduate", "first login"],
    ["1", 2, "master", "first login"],
    ["3", 2, "master", "first login"],
    ["4", 2, "master", "first login"],
    ["5", 3, "doctor", "first login"],
    ["7", 4, "masterDoctorDoctor", "first login"],
    ["8", 5, "masterDoctorMaster", "first login"],
    ["9", 6, "allPrograms", "first login"],
    ["10", 7, "auditor", "first login"],
    ["7", 4, "masterDoctorDoctor", "existing degree"],
    ["8", 5, "masterDoctorMaster", "existing degree"],
    ["9", 6, "allPrograms", "existing degree"],
    ["10", 7, "auditor", "existing degree"],
  ] as const)(
    "preserves SSO %s as degree %s / %s through %s and token refresh",
    async (progCode, studentEnum, profileKey, mode) => {
      const studentProfile = {
        ...profile(),
        kaist_v2_info: {
          ...profile().kaist_v2_info,
          std_no: "20268083",
          std_prog_code: progCode,
        },
      };
      if (mode === "existing degree") {
        sso.getUserInfo.mockResolvedValue({
          ...studentProfile,
          kaist_v2_info: {
            ...studentProfile.kaist_v2_info,
            std_prog_code: "5",
          },
        });
        await signIn();
        expect(await prisma.studentT.findFirst()).toMatchObject({
          studentEnum: 3,
        });
      }
      sso.getUserInfo.mockResolvedValue(studentProfile);
      await signIn();
      const user = await prisma.user.findFirstOrThrow();
      const student = await prisma.student.findFirstOrThrow();
      expect(await prisma.studentT.findFirstOrThrow()).toMatchObject({
        studentId: student.id,
        studentEnum,
      });
      const identity = await module
        .get(UserPublicService)
        .findLoginIdentity(user.id);
      expect(identity).toMatchObject({
        [profileKey]: { id: student.id, number: 20268083 },
      });
      const refreshed = await module.get(AuthService).postAuthRefresh(identity);
      expect(Object.keys(refreshed.accessToken)).toEqual([profileKey]);
      expect(jwt.sign).toHaveBeenLastCalledWith(
        expect.objectContaining({
          type: profileKey,
          studentId: student.id,
          studentNumber: 20268083,
        }),
        expect.any(Object),
      );
      expect(await prisma.authSsoLoginFailureLog.count()).toBe(0);
    },
  );

  it.each([
    ["재학", 1, "expired"],
    ["휴학", 2, "expired"],
    ["재학", 1, "current"],
  ] as const)(
    "logs in a former HP student: status=%s(%s), HP term=%s",
    async (status, studentStatusEnum, hpTermState) => {
      const semester = await prisma.semesterD.findFirstOrThrow();
      const user = await prisma.user.create({
        data: {
          sid: profile().sid,
          name: "HP 전환 테스트 학생",
          email: profile().kaist_v2_info.email,
        },
      });
      const current = await prisma.student.create({
        data: { userId: user.id, name: user.name, number: 20990127 },
      });
      const hp = await prisma.student.create({
        data: { userId: user.id, name: user.name, number: 20986954 },
      });
      const hpSemester =
        hpTermState === "current"
          ? semester
          : await prisma.semesterD.create({
              data: {
                year: 2025,
                name: "봄",
                startTerm: new Date("2025-03-01"),
                endTerm: new Date("2025-09-01"),
              },
            });
      const hpTerm = await prisma.studentT.create({
        data: {
          studentId: hp.id,
          semesterId: hpSemester.id,
          startTerm: hpSemester.startTerm,
          endTerm: hpSemester.endTerm,
          studentEnum: 3,
          studentStatusEnum: 1,
        },
      });
      sso.getUserInfo.mockResolvedValue({
        ...profile(),
        kaist_v2_info: {
          ...profile().kaist_v2_info,
          std_no: String(current.number),
          std_prog_code: "0",
          std_status_kor: status,
        },
      });

      const signedIn = await signIn();
      expect(signedIn.isKaistIamLogin).toBe(true);
      expect(Object.keys(signedIn.token.accessToken)).toEqual([
        "undergraduate",
      ]);
      expect(
        await prisma.studentT.findMany({ where: { studentId: current.id } }),
      ).toEqual([
        expect.objectContaining({
          semesterId: semester.id,
          studentEnum: 1,
          studentStatusEnum,
        }),
      ]);
      expect(
        await prisma.student.findUniqueOrThrow({ where: { id: hp.id } }),
      ).toEqual(hp);
      expect(
        await prisma.studentT.findMany({ where: { studentId: hp.id } }),
      ).toEqual([hpTerm]);

      const identity = await module
        .get(UserPublicService)
        .findLoginIdentity(user.id);
      expect(identity).toEqual({
        id: user.id,
        sid: user.sid,
        name: profile().kaist_v2_info.user_nm,
        email: user.email,
        undergraduate: { id: current.id, number: current.number },
      });
      const refreshed = await module.get(AuthService).postAuthRefresh(identity);
      expect(Object.keys(refreshed.accessToken)).toEqual(["undergraduate"]);
      expect(jwt.sign).toHaveBeenLastCalledWith(
        expect.objectContaining({
          type: "undergraduate",
          studentId: current.id,
          studentNumber: current.number,
        }),
        expect.any(Object),
      );
      expect(jwt.sign).not.toHaveBeenCalledWith(
        expect.objectContaining({ studentId: hp.id }),
        expect.any(Object),
      );
      expect(await prisma.student.count()).toBe(2);
      expect(await prisma.authActivatedRefreshTokens.count()).toBe(1);
      expect(await prisma.authSsoLoginFailureLog.count()).toBe(0);
    },
  );

  it("logs in and refreshes a combined-degree student with an expired exchange record", async () => {
    const semester = await prisma.semesterD.findFirstOrThrow();
    const user = await prisma.user.create({
      data: {
        sid: profile().sid,
        name: "교환 이력 테스트 학생",
        email: profile().kaist_v2_info.email,
      },
    });
    const current = await prisma.student.create({
      data: { userId: user.id, name: user.name, number: 20998369 },
    });
    const prior = await prisma.student.create({
      data: { userId: user.id, name: user.name, number: 20986535 },
    });
    const priorSemester = await prisma.semesterD.create({
      data: {
        year: 2025,
        name: "봄",
        startTerm: new Date("2025-03-01"),
        endTerm: new Date("2025-09-01"),
      },
    });
    const priorTerm = await prisma.studentT.create({
      data: {
        studentId: prior.id,
        semesterId: priorSemester.id,
        startTerm: priorSemester.startTerm,
        endTerm: priorSemester.endTerm,
        studentEnum: 2,
        studentStatusEnum: 1,
      },
    });
    sso.getUserInfo.mockResolvedValue({
      ...profile(),
      kaist_v2_info: {
        ...profile().kaist_v2_info,
        std_no: String(current.number),
        std_prog_code: "8",
      },
    });

    const signedIn = await signIn();
    expect(signedIn.isKaistIamLogin).toBe(true);
    expect(Object.keys(signedIn.token.accessToken)).toEqual([
      "masterDoctorMaster",
    ]);
    expect(
      await prisma.studentT.findMany({ where: { studentId: current.id } }),
    ).toEqual([
      expect.objectContaining({
        semesterId: semester.id,
        studentEnum: 5,
        studentStatusEnum: 1,
      }),
    ]);
    const identity = await module
      .get(UserPublicService)
      .findLoginIdentity(user.id);
    expect(identity.masterDoctorMaster).toEqual({
      id: current.id,
      number: current.number,
    });
    expect(identity.master).toBeUndefined();
    const refreshed = await module.get(AuthService).postAuthRefresh(identity);
    expect(Object.keys(refreshed.accessToken)).toEqual(["masterDoctorMaster"]);
    expect(jwt.sign).toHaveBeenLastCalledWith(
      expect.objectContaining({
        type: "masterDoctorMaster",
        studentId: current.id,
        studentNumber: current.number,
      }),
      expect.any(Object),
    );
    expect(jwt.sign).not.toHaveBeenCalledWith(
      expect.objectContaining({ studentId: prior.id }),
      expect.any(Object),
    );
    expect(
      await prisma.student.findUniqueOrThrow({ where: { id: prior.id } }),
    ).toEqual(prior);
    expect(
      await prisma.studentT.findMany({ where: { studentId: prior.id } }),
    ).toEqual([priorTerm]);
    expect(await prisma.authSsoLoginFailureLog.count()).toBe(0);
  });

  it.each([
    [20996535, "0", 1, "undergraduate", "재학", 1],
    [20996535, "0", 1, "undergraduate", "휴학", 2],
    [20998001, "1", 2, "master", "재학", 1],
    [20998001, "1", 2, "master", "휴학", 2],
  ] as const)(
    "logs in exchange number %s with code %s, degree %s, profile %s and status %s(%s)",
    async (
      studentNumber,
      progCode,
      studentEnum,
      profileKey,
      status,
      studentStatusEnum,
    ) => {
      sso.getUserInfo.mockResolvedValue({
        ...profile(),
        kaist_v2_info: {
          ...profile().kaist_v2_info,
          std_no: String(studentNumber),
          std_prog_code: progCode,
          std_status_kor: status,
        },
      });

      const signedIn = await signIn();
      expect(signedIn.isKaistIamLogin).toBe(true);
      expect(Object.keys(signedIn.token.accessToken)).toEqual([profileKey]);
      const user = await prisma.user.findFirstOrThrow();
      const student = await prisma.student.findFirstOrThrow();
      expect(student.number).toBe(studentNumber);
      const semester = await prisma.semesterD.findFirstOrThrow();
      await expect(
        module
          .get(UserPublicService)
          .isNotGraduateStudent(student.id, semester.id),
      ).resolves.toBe(true);
      expect(await prisma.studentT.findMany()).toEqual([
        expect.objectContaining({
          studentId: student.id,
          studentEnum,
          studentStatusEnum,
        }),
      ]);
      const identity = await module
        .get(UserPublicService)
        .findLoginIdentity(user.id);
      expect(identity[profileKey]).toEqual({
        id: student.id,
        number: studentNumber,
      });
      const refreshed = await module.get(AuthService).postAuthRefresh(identity);
      expect(Object.keys(refreshed.accessToken)).toEqual([profileKey]);
      expect(jwt.sign).toHaveBeenLastCalledWith(
        expect.objectContaining({
          type: profileKey,
          studentId: student.id,
          studentNumber,
        }),
        expect.any(Object),
      );
      expect(await prisma.authSsoLoginFailureLog.count()).toBe(0);
    },
  );

  it("preserves an ordinary prior degree profile after its academic term expires", async () => {
    const studentProfile = profile();
    studentProfile.kaist_v2_info.std_no = "20980127";
    studentProfile.kaist_v2_info.std_prog_code = "0";
    sso.getUserInfo.mockResolvedValue(studentProfile);
    await signIn();
    const prior = await prisma.student.findFirstOrThrow();
    await prisma.studentT.updateMany({
      data: {
        startTerm: new Date("2025-03-01"),
        endTerm: new Date("2025-09-01"),
      },
    });
    sso.getUserInfo.mockResolvedValue({
      ...studentProfile,
      kaist_v2_info: {
        ...studentProfile.kaist_v2_info,
        std_no: "20998083",
        std_prog_code: "7",
      },
    });
    const signedIn = await signIn();
    expect(Object.keys(signedIn.token.accessToken)).toEqual([
      "undergraduate",
      "masterDoctorDoctor",
    ]);
    const identity = await module
      .get(UserPublicService)
      .findLoginIdentity(prior.userId);
    expect(identity.undergraduate).toEqual({
      id: prior.id,
      number: prior.number,
    });
    const refreshed = await module.get(AuthService).postAuthRefresh(identity);
    expect(Object.keys(refreshed.accessToken)).toEqual([
      "undergraduate",
      "masterDoctorDoctor",
    ]);
    expect(await prisma.authSsoLoginFailureLog.count()).toBe(0);
  });

  it("rejects a current HP number even when the user already has a regular student profile", async () => {
    const studentProfile = profile();
    studentProfile.kaist_v2_info.std_no = "20980127";
    studentProfile.kaist_v2_info.std_prog_code = "0";
    sso.getUserInfo.mockResolvedValue(studentProfile);
    await signIn();
    const user = await prisma.user.findFirstOrThrow();
    const student = await prisma.student.findFirstOrThrow();
    const term = await prisma.studentT.findFirstOrThrow();
    jwt.sign.mockClear();
    sso.getUserInfo.mockResolvedValue({
      ...studentProfile,
      kaist_v2_info: {
        ...studentProfile.kaist_v2_info,
        std_no: "20996954",
      },
    });
    await expect(signIn()).rejects.toThrow("HP 학번은 로그인할 수 없습니다.");
    expect(await prisma.user.findMany()).toEqual([user]);
    expect(await prisma.student.findMany()).toEqual([student]);
    expect(await prisma.studentT.findMany()).toEqual([term]);
    expect(await prisma.authActivatedRefreshTokens.count()).toBe(1);
    expect(jwt.sign).not.toHaveBeenCalled();
    expect(await prisma.authSsoLoginFailureLog.findMany()).toEqual([
      expect.objectContaining({
        stage: "db.student.validate",
        userId: user.id,
      }),
    ]);
  });

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
