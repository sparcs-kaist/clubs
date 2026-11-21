import { Global, INestApplication, Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { Test } from "@nestjs/testing";
import request from "supertest";

import { ProfessorApprovalStatus } from "@clubs/domain/activity/activity";

import {
  ActivityDeadlineEnum,
  ActivityDurationTypeEnum,
  ActivityStatusEnum,
  ActivityTypeEnum,
} from "@clubs/interface/common/enum/activity.enum";
import {
  ClubDelegateEnum,
  ClubTypeEnum,
} from "@clubs/interface/common/enum/club.enum";

import { CLOCK, Clock } from "@sparcs-clubs/api/common/clock/clock";
import { ClockModule } from "@sparcs-clubs/api/common/clock/clock.module";
import { RandomModule } from "@sparcs-clubs/api/common/random/random.module";
import { TransactionModule } from "@sparcs-clubs/api/common/transaction/transaction.module";
import {
  HttpExceptionFilter,
  ZodErrorFilter,
} from "@sparcs-clubs/api/common/util/exception.filter";
import { AppConfigService } from "@sparcs-clubs/api/config/app-config.service";
import ActivityModule from "@sparcs-clubs/api/feature/activity/activity.module";
import { JwtAccessGuard } from "@sparcs-clubs/api/feature/auth/guard/jwt-access.guard";
import { JwtAccessStrategy } from "@sparcs-clubs/api/feature/auth/strategy/jwt-access.strategy";
import { PrismaService } from "@sparcs-clubs/api/prisma/prisma.service";

import { clearDatabase, closeDatabase } from "./setup";

jest.mock("@sparcs-clubs/api/env", () => ({ env: { NODE_ENV: "test" } }));

const secret = "activity-approval-integration-secret";

@Global()
@Module({
  providers: [
    {
      provide: AppConfigService,
      useValue: {
        accessTokenSecretKey: secret,
        s3Region: "ap-northeast-2",
        s3AccessKey: "test",
        s3SecretAccessKey: "test",
        s3BucketName: "clubs-test-evidence",
      },
    },
  ],
  exports: [AppConfigService],
})
class TestConfigModule {}

describe("Professor activity approvals with MySQL", () => {
  const { Pending, Approved, LateApproved } = ProfessorApprovalStatus;
  const writingEnd = new Date("2026-11-20T09:00:00Z");
  const activityDates = {
    startTerm: new Date("2026-09-15T05:00:00Z"),
    endTerm: new Date("2026-09-15T06:00:00Z"),
  };
  let now = new Date("2026-11-19T09:00:00Z");
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const fixture = await Test.createTestingModule({
      imports: [
        TestConfigModule,
        ClockModule,
        RandomModule,
        TransactionModule,
        ActivityModule,
      ],
      providers: [
        JwtAccessStrategy,
        { provide: APP_GUARD, useClass: JwtAccessGuard },
      ],
    })
      .overrideProvider(CLOCK)
      .useValue({ now: () => now, endOfToday: () => now })
      .compile();
    app = fixture.createNestApplication();
    const clock = fixture.get<Clock>(CLOCK);
    app.useGlobalFilters(
      new ZodErrorFilter(clock),
      new HttpExceptionFilter(clock),
    );
    await app.init();
    prisma = fixture.get(PrismaService);
    await clearDatabase();
  });

  afterAll(async () => {
    await app?.close();
    await closeDatabase();
  });

  it("resets writing edits, keeps modification edits and records each approval once", async () => {
    const dateRange = {
      startTerm: new Date("2026-09-01T00:00:00Z"),
      endTerm: new Date("2027-01-01T00:00:00Z"),
    };
    const semester = await prisma.semesterD.create({
      data: { year: 2026, name: "Fall", ...dateRange },
    });
    const nextSemester = await prisma.semesterD.create({
      data: {
        year: 2027,
        name: "Spring",
        startTerm: dateRange.endTerm,
        endTerm: new Date("2027-07-01T00:00:00Z"),
      },
    });
    const term = await prisma.activityD.create({
      data: {
        year: 2026,
        name: "Fall",
        semesterId: semester.id,
        ...dateRange,
        endTerm: new Date("2026-12-25T00:00:00Z"),
        activityDurationTypeEnum: ActivityDurationTypeEnum.Regular,
      },
    });
    await prisma.activityDeadlineD.createMany({
      data: [
        {
          semesterId: semester.id,
          deadlineEnum: ActivityDeadlineEnum.Writing,
          startTerm: new Date("2026-11-15T00:00:00Z"),
          endTerm: writingEnd,
        },
        {
          semesterId: semester.id,
          deadlineEnum: ActivityDeadlineEnum.Modification,
          startTerm: writingEnd,
          endTerm: new Date("2026-11-26T00:00:00Z"),
        },
        {
          semesterId: nextSemester.id,
          deadlineEnum: ActivityDeadlineEnum.Writing,
          startTerm: writingEnd,
          endTerm: new Date("2026-11-26T00:00:00Z"),
        },
      ],
    });
    const user = await prisma.user.create({ data: { name: "Club delegate" } });
    const student = await prisma.student.create({
      data: { userId: user.id, name: user.name, number: 20260081 },
    });
    const professor = await prisma.professor.create({
      data: { name: "Advisor" },
    });
    const district = await prisma.district.create({ data: { name: "Test" } });
    const division = await prisma.division.create({
      data: { name: "Test", districtId: district.id },
    });
    const club = await prisma.club.create({
      data: {
        nameKr: "활동보고서 테스트",
        divisionId: division.id,
        foundingYear: 2020,
      },
    });
    const clubTerm = await prisma.clubT.create({
      data: {
        clubId: club.id,
        professorId: professor.id,
        semesterId: semester.id,
        clubStatusEnumId: ClubTypeEnum.Regular,
        ...dateRange,
      },
    });
    await prisma.clubStudentT.create({
      data: {
        clubId: club.id,
        studentId: student.id,
        semesterId: semester.id,
        ...dateRange,
      },
    });
    await prisma.clubDelegateD.create({
      data: {
        clubId: club.id,
        studentId: student.id,
        clubDelegateEnum: ClubDelegateEnum.Representative,
        ...dateRange,
      },
    });
    const evidence = await prisma.file.create({
      data: {
        id: "approval-evidence",
        name: "evidence.pdf",
        extension: "pdf",
        size: 1,
        userId: user.id,
        signedAt: now,
      },
    });
    const activityBody = {
      name: "정규 활동",
      activityTypeEnumId: ActivityTypeEnum.matchedInternalActivity,
      location: "동아리방",
      purpose: "연습",
      detail: "합주",
      evidence: "사진",
    };
    const createActivity = () =>
      prisma.activity.create({
        data: {
          ...activityBody,
          originalName: activityBody.name,
          clubId: club.id,
          activityDId: term.id,
          activityStatusEnumId: ActivityStatusEnum.Applied,
          activityTs: { create: activityDates },
        },
      });
    const first = await createActivity();
    const second = await createActivity();
    const third = await createActivity();
    const fourth = await createActivity();
    const sign = (payload: object) =>
      `Bearer ${new JwtService().sign(payload, { secret })}`;
    const advisor = sign({
      id: professor.id,
      professorId: professor.id,
      type: "professor",
    });
    const delegate = sign({
      id: user.id,
      studentId: student.id,
      type: "undergraduate",
    });
    const server = app.getHttpServer();
    const approve = (ids: number[], authorization = advisor) =>
      request(server)
        .post("/professor/activities/approve")
        .set("Authorization", authorization)
        .send({ activities: ids.map(id => ({ id })) });
    const edit = () =>
      request(server)
        .put(`/student/activities/activity/${first.id}`)
        .set("Authorization", delegate)
        .send({
          ...activityBody,
          durations: [activityDates],
          evidenceFiles: [{ fileId: evidence.id }],
          participants: [{ studentId: student.id }],
        })
        .expect(200);
    const expectDetail = (
      status: ProfessorApprovalStatus,
      approvedAt: Date | null,
    ) =>
      Promise.all(
        [
          ["student", delegate],
          ["professor", advisor],
        ].map(([role, authorization]) =>
          request(server)
            .get(`/${role}/activities/activity/${first.id}`)
            .set("Authorization", authorization)
            .expect(200)
            .expect(({ body }) => {
              expect(body).toMatchObject({
                professorApprovalStatus: status,
                professorApprovedAt: approvedAt?.toISOString() ?? null,
              });
              if (role === "professor") {
                expect(body.canProfessorApprove).toBe(status === Pending);
              }
            }),
        ),
      );

    await approve(
      [first.id],
      sign({ id: 999, professorId: 999, type: "professor" }),
    ).expect(403);
    await approve([first.id]).expect(201);
    const originalApprovalTime = now;
    await edit();
    await expectDetail(Pending, null);
    expect(
      await prisma.activity.findUniqueOrThrow({ where: { id: first.id } }),
    ).toMatchObject({
      professorApprovalStatus: Pending,
      professorApprovedAt: null,
    });
    await approve([first.id]).expect(201);
    now = writingEnd;
    await approve([second.id, 2147483647]).expect(404);
    expect(
      await prisma.activity.findUniqueOrThrow({ where: { id: second.id } }),
    ).toMatchObject({
      professorApprovalStatus: Pending,
      professorApprovedAt: null,
    });
    await approve([second.id]).expect(201);
    await edit();
    await expectDetail(Approved, originalApprovalTime);

    const afterDeadlines = new Date("2026-11-28T09:00:00Z");
    now = afterDeadlines;
    await Promise.all([
      approve([fourth.id]).expect(201),
      approve([first.id, second.id, third.id, fourth.id]).expect(201),
    ]);
    const approvals = await prisma.activityProfessorApprovalLog.findMany({
      orderBy: { activityId: "asc" },
      select: {
        activityId: true,
        approvalStatus: true,
        approvedAt: true,
        professorId: true,
      },
    });
    expect(approvals).toEqual([
      ...[first.id, first.id].map(activityId => ({
        activityId,
        approvalStatus: Approved,
        approvedAt: originalApprovalTime,
        professorId: professor.id,
      })),
      {
        activityId: second.id,
        approvalStatus: LateApproved,
        approvedAt: writingEnd,
        professorId: professor.id,
      },
      ...[third.id, fourth.id].map(activityId => ({
        activityId,
        approvalStatus: LateApproved,
        approvedAt: afterDeadlines,
        professorId: professor.id,
      })),
    ]);

    await prisma.clubT.update({
      where: { id: clubTerm.id },
      data: { endTerm: now },
    });
    await approve([first.id]).expect(403);
  }, 30000);
});
