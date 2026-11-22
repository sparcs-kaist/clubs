import { Global, Module } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";

import { ClubDelegateEnum as Role } from "@clubs/interface/common/enum/club.enum";
import {
  RegistrationApplicationStudentStatusEnum as MemberStatus,
  RegistrationDeadlineEnum,
  RegistrationStatusEnum,
  RegistrationTypeEnum,
} from "@clubs/interface/common/enum/registration.enum";

import { CLOCK } from "@sparcs-clubs/api/common/clock/clock";
import { ClockModule } from "@sparcs-clubs/api/common/clock/clock.module";
import { RandomModule } from "@sparcs-clubs/api/common/random/random.module";
import { TransactionModule } from "@sparcs-clubs/api/common/transaction/transaction.module";
import { AppConfigService } from "@sparcs-clubs/api/config/app-config.service";
import ClubStudentTRepository from "@sparcs-clubs/api/feature/club/repository-old/club.club-student-t.repository";
import { ClubOldRepository } from "@sparcs-clubs/api/feature/club/repository-old/club-old.repository";
import RegistrationModule from "@sparcs-clubs/api/feature/registration/registration.module";
import { RegistrationService } from "@sparcs-clubs/api/feature/registration/service/registration.service";
import { PrismaModule } from "@sparcs-clubs/api/prisma/prisma.module";
import { PrismaService } from "@sparcs-clubs/api/prisma/prisma.service";

import { clearDatabase, closeDatabase } from "./setup";

jest.mock("@sparcs-clubs/api/env", () => ({ env: { NODE_ENV: "test" } }));

jest.setTimeout(30_000);

@Global()
@Module({
  providers: [
    {
      provide: AppConfigService,
      useValue: {
        s3Region: "ap-northeast-2",
        s3AccessKey: "test-key",
        s3SecretAccessKey: "test-secret",
      },
    },
  ],
  exports: [AppConfigService],
})
class TestFileConfigModule {}

const previousTerm = {
  startTerm: new Date("2026-03-01T00:00:00Z"),
  endTerm: new Date("2026-08-31T23:59:59Z"),
};
const targetTerm = {
  startTerm: new Date("2026-09-01T00:00:00Z"),
  endTerm: new Date("2027-02-28T23:59:59Z"),
};
const approvedAt = new Date("2026-09-15T06:00:00Z");

describe("club registration approval with MySQL", () => {
  let fixture: TestingModule;
  let service: RegistrationService;
  let prisma: PrismaService;

  beforeAll(async () => {
    fixture = await Test.createTestingModule({
      imports: [
        ClockModule,
        PrismaModule,
        RandomModule,
        TransactionModule,
        TestFileConfigModule,
        RegistrationModule,
      ],
    })
      .overrideProvider(CLOCK)
      .useValue({ now: () => approvedAt })
      .compile();
    await fixture.init();
    service = fixture.get(RegistrationService);
    prisma = fixture.get(PrismaService);
  });

  beforeEach(clearDatabase);

  afterAll(async () => {
    await fixture?.close();
    await closeDatabase();
  });

  it("ends old office terms at the previous semester and retains only the applicant in the target roster", async () => {
    const targetSemester = await prisma.semesterD.create({
      data: { year: 2026, name: "Fall", ...targetTerm },
    });
    const previousSemester = await prisma.semesterD.create({
      data: { year: 2026, name: "Spring", ...previousTerm },
    });
    const { id: semesterId } = targetSemester;
    await prisma.registrationDeadlineD.create({
      data: {
        semesterId,
        deadlineEnum: RegistrationDeadlineEnum.ClubRegistrationApplication,
        ...targetTerm,
      },
    });
    const district = await prisma.district.create({
      data: { name: "테스트 지구" },
    });
    const { id: divisionId } = await prisma.division.create({
      data: { name: "테스트 분과", districtId: district.id },
    });
    const { id: clubId } = await prisma.club.create({
      data: { nameKr: "승인 테스트 동아리", foundingYear: 2020, divisionId },
    });
    const [representative, delegate1, applicant] = await Promise.all(
      [20268001, 20268002, 20268003].map(number =>
        prisma.student.create({ data: { name: String(number), number } }),
      ),
    );
    const officeTerms = [
      { studentId: representative.id, clubDelegateEnum: Role.Representative },
      { studentId: delegate1.id, clubDelegateEnum: Role.Delegate1 },
      { studentId: applicant.id, clubDelegateEnum: Role.Delegate2 },
    ];
    await prisma.clubDelegateD.createMany({
      data: officeTerms.map(term => ({
        ...term,
        clubId,
        startTerm: previousTerm.startTerm,
      })),
    });
    const { id: provisionalTermId } = await prisma.clubDelegateD.create({
      data: {
        clubId,
        studentId: applicant.id,
        clubDelegateEnum: Role.Representative,
        startTerm: new Date("2026-09-05T00:00:00Z"),
      },
    });
    const history = await prisma.clubStudentT.create({
      data: {
        clubId,
        studentId: representative.id,
        semesterId: previousSemester.id,
        ...previousTerm,
      },
    });
    const residual = await prisma.clubStudentT.create({
      data: { clubId, studentId: representative.id, semesterId, ...targetTerm },
    });
    await prisma.registrationApplicationStudent.createMany({
      data: [
        {
          semesterId: previousSemester.id,
          studentId: representative.id,
          registrationApplicationStudentEnum: MemberStatus.Approved,
        },
        {
          semesterId,
          studentId: representative.id,
          registrationApplicationStudentEnum: MemberStatus.Approved,
        },
        {
          semesterId,
          studentId: applicant.id,
          registrationApplicationStudentEnum: MemberStatus.Pending,
        },
      ].map(member => ({ ...member, clubId })),
    });
    const registration = await prisma.registration.create({
      data: {
        clubId,
        semesterId,
        studentId: applicant.id,
        divisionId,
        foundedAt: new Date("2020-01-01T00:00:00Z"),
        registrationApplicationTypeEnumId: RegistrationTypeEnum.Renewal,
        registrationApplicationStatusEnumId: RegistrationStatusEnum.Pending,
      },
    });

    await service.patchExecutiveRegistrationsClubRegistrationApproval(
      registration.id,
    );

    expect(
      await prisma.registration.findUniqueOrThrow({
        where: { id: registration.id },
      }),
    ).toMatchObject({
      registrationApplicationStatusEnumId: RegistrationStatusEnum.Approved,
      reviewedAt: approvedAt,
    });
    const terms = await prisma.clubDelegateD.findMany({
      where: { clubId, deletedAt: null },
      select: {
        studentId: true,
        clubDelegateEnum: true,
        startTerm: true,
        endTerm: true,
      },
      orderBy: { id: "asc" },
    });
    expect(terms).toEqual([
      ...officeTerms.map(term => ({ ...term, ...previousTerm })),
      {
        studentId: applicant.id,
        clubDelegateEnum: Role.Representative,
        startTerm: targetTerm.startTerm,
        endTerm: null,
      },
    ]);
    expect(
      await prisma.clubDelegateD.findUnique({
        where: { id: provisionalTermId },
      }),
    ).toMatchObject({ deletedAt: approvedAt });
    expect(
      await prisma.clubStudentT.findMany({
        where: { clubId, semesterId, deletedAt: null },
      }),
    ).toEqual([
      expect.objectContaining({ studentId: applicant.id, ...targetTerm }),
    ]);
    expect(
      await prisma.clubStudentT.findUnique({ where: { id: residual.id } }),
    ).toMatchObject({ deletedAt: approvedAt });
    expect(
      await prisma.clubStudentT.findUnique({ where: { id: history.id } }),
    ).toEqual(history);
    const applications = await prisma.registrationApplicationStudent.findMany({
      where: { clubId, deletedAt: null },
      orderBy: { id: "asc" },
    });
    expect(applications).toMatchObject([
      {
        semesterId: previousSemester.id,
        studentId: representative.id,
        registrationApplicationStudentEnum: MemberStatus.Approved,
      },
      {
        semesterId,
        studentId: representative.id,
        registrationApplicationStudentEnum: MemberStatus.Pending,
      },
      {
        semesterId,
        studentId: applicant.id,
        registrationApplicationStudentEnum: MemberStatus.Approved,
      },
    ]);
    const membershipRepository = fixture.get(ClubStudentTRepository);
    await expect(
      membershipRepository.getClubsByStudentId(representative.id),
    ).resolves.toEqual([]);
    await expect(
      membershipRepository.getClubsByStudentId(applicant.id),
    ).resolves.toEqual([expect.objectContaining({ id: clubId })]);
    await expect(
      fixture.get(ClubOldRepository).findClubActivities(representative.id),
    ).resolves.toMatchObject({
      clubs: [
        {
          id: clubId,
          dateRange: [
            {
              startMonth: previousTerm.startTerm,
              endMonth: previousTerm.endTerm,
            },
          ],
        },
      ],
    });
  });
});
