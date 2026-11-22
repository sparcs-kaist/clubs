import { Test, TestingModule } from "@nestjs/testing";

import type { ApiReg001RequestBody } from "@clubs/interface/api/registration/endpoint/apiReg001";
import { ClubDelegateEnum } from "@clubs/interface/common/enum/club.enum";
import { RegistrationTypeEnum } from "@clubs/interface/common/enum/registration.enum";

import { ClockModule } from "@sparcs-clubs/api/common/clock/clock.module";
import { TransactionModule } from "@sparcs-clubs/api/common/transaction/transaction.module";
import ClubPublicService from "@sparcs-clubs/api/feature/club/service/club.public.service";
import DivisionPublicService from "@sparcs-clubs/api/feature/division/service/division.public.service";
import FilePublicService from "@sparcs-clubs/api/feature/file/service/file.public.service";
import { ClubRegistrationRepository } from "@sparcs-clubs/api/feature/registration/repository/club-registration.repository";
import { ClubRegistrationApprovalRepository } from "@sparcs-clubs/api/feature/registration/repository/club-registration-approval.repository";
import { MemberRegistrationRepository } from "@sparcs-clubs/api/feature/registration/repository/member-registration.repository";
import { RegistrationPublicService } from "@sparcs-clubs/api/feature/registration/service/registration.public.service";
import { RegistrationService } from "@sparcs-clubs/api/feature/registration/service/registration.service";
import { RegistrationDeadlinePublicService } from "@sparcs-clubs/api/feature/semester/publicService/registration.deadline.public.service";
import { SemesterPublicService } from "@sparcs-clubs/api/feature/semester/publicService/semester.public.service";
import UserRepository from "@sparcs-clubs/api/feature/user/repository/user.repository";
import UserPublicService from "@sparcs-clubs/api/feature/user/service/user.public.service";
import { PrismaModule } from "@sparcs-clubs/api/prisma/prisma.module";
import { PrismaService } from "@sparcs-clubs/api/prisma/prisma.service";

import { clearDatabase, closeDatabase } from "./setup";

jest.mock("@sparcs-clubs/api/env", () => ({ env: { NODE_ENV: "test" } }));

const originalPhone = "010-1111-2222";
const submittedPhone = "010-3333-4444";
const profilePhone = "010-5555-6666";
const changedPhone = "010-7777-8888";

describe("club registration contact", () => {
  let fixture: TestingModule;
  let service: RegistrationService;
  let prisma: PrismaService;
  let users: UserPublicService;
  let applicant: { userId: number; studentId: number };
  let body: ApiReg001RequestBody;
  let semesterId: number;

  beforeAll(async () => {
    fixture = await Test.createTestingModule({
      imports: [ClockModule, PrismaModule, TransactionModule],
      providers: [
        ClubRegistrationRepository,
        RegistrationService,
        UserRepository,
        {
          provide: UserPublicService,
          inject: [UserRepository],
          useFactory: (repository: UserRepository) => ({
            updatePhoneNumber: repository.updatePhoneNumber.bind(repository),
          }),
        },
        {
          provide: ClubPublicService,
          useValue: {
            getClubByClubId: ({ clubId }: { clubId: number }) =>
              prisma.club.findMany({ where: { id: clubId } }),
            lockRegistrationApplicant: jest.fn(),
            lockRegistrationClub: jest.fn(),
          },
        },
        {
          provide: DivisionPublicService,
          useValue: { findDivisionById: async (id: number) => ({ id }) },
        },
        {
          provide: FilePublicService,
          useValue: { getFileInfoById: async (id: string) => ({ id }) },
        },
        {
          provide: RegistrationPublicService,
          useValue: { checkDeadline: jest.fn() },
        },
        {
          provide: SemesterPublicService,
          useValue: { loadId: async () => semesterId },
        },
        { provide: RegistrationDeadlinePublicService, useValue: {} },
        { provide: ClubRegistrationApprovalRepository, useValue: {} },
        { provide: MemberRegistrationRepository, useValue: {} },
      ],
    }).compile();
    await fixture.init();
    service = fixture.get(RegistrationService);
    prisma = fixture.get(PrismaService);
    users = fixture.get(UserPublicService);
  });

  beforeEach(async () => {
    await clearDatabase();
    const user = await prisma.user.create({
      data: { name: "신청자", phoneNumber: originalPhone },
    });
    const student = await prisma.student.create({
      data: { name: user.name, number: 20260001, userId: user.id },
    });
    const district = await prisma.district.create({ data: { name: "지구" } });
    const division = await prisma.division.create({
      data: { name: "분과", districtId: district.id },
    });
    const semester = await prisma.semesterD.create({
      data: {
        year: 2026,
        name: "Fall",
        startTerm: new Date("2026-09-01T00:00:00Z"),
        endTerm: new Date("2026-12-31T00:00:00Z"),
      },
    });
    const activityPlan = await prisma.file.create({
      data: {
        id: "registration-plan",
        name: "활동계획서",
        extension: "pdf",
        size: 1,
        userId: user.id,
        signedAt: new Date("2026-11-21T00:00:00Z"),
      },
    });
    applicant = { userId: user.id, studentId: student.id };
    semesterId = semester.id;
    body = {
      registrationTypeEnumId: RegistrationTypeEnum.NewProvisional,
      clubNameKr: "테스트 동아리",
      clubNameEn: "Test Club",
      phoneNumber: submittedPhone,
      foundedAt: new Date("2026-01-01T00:00:00Z"),
      divisionId: division.id,
      activityFieldKr: "활동",
      activityFieldEn: "Activities",
      divisionConsistency: "분과 적합성",
      foundationPurpose: "설립 목적",
      activityPlan: "활동 계획",
      activityPlanFileId: activityPlan.id,
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await fixture?.close();
    await closeDatabase();
  });

  function readUser() {
    return prisma.user.findUniqueOrThrow({ where: { id: applicant.userId } });
  }

  function readRegistration(id: number) {
    return prisma.registration.findUniqueOrThrow({ where: { id } });
  }

  function failAfterUpdatingUser() {
    const update = users.updatePhoneNumber.bind(users);
    jest
      .spyOn(users, "updatePhoneNumber")
      .mockImplementationOnce(async (id, phone) => {
        await update(id, phone);
        throw new Error("전화번호 저장 실패");
      });
  }

  it("stores submitted and changed numbers while unrelated edits keep the saved profile number", async () => {
    const { id } = await service.postStudentRegistrationClubRegistration(
      applicant,
      body,
    );
    await expect(readUser()).resolves.toMatchObject({
      phoneNumber: submittedPhone,
    });
    await expect(readRegistration(id)).resolves.toMatchObject({
      phoneNumber: submittedPhone,
    });

    await prisma.user.update({
      where: { id: applicant.userId },
      data: { phoneNumber: profilePhone },
    });
    await service.putStudentRegistrationsClubRegistration(applicant, id, {
      ...body,
      phoneNumber: undefined,
      activityPlan: "수정한 활동 계획",
    });
    await service.putStudentRegistrationsClubRegistration(applicant, id, {
      ...body,
      activityPlan: "기존 클라이언트가 수정한 활동 계획",
    });
    await expect(readUser()).resolves.toMatchObject({
      phoneNumber: profilePhone,
    });
    await expect(readRegistration(id)).resolves.toMatchObject({
      phoneNumber: submittedPhone,
    });

    await service.putStudentRegistrationsClubRegistration(applicant, id, {
      ...body,
      phoneNumber: changedPhone,
    });
    await expect(readUser()).resolves.toMatchObject({
      phoneNumber: changedPhone,
    });
    await expect(readRegistration(id)).resolves.toMatchObject({
      phoneNumber: changedPhone,
    });
  });

  it("updates the applicant's number without changing the current representative's number", async () => {
    const representativePhone = "010-9999-1111";
    const representative = await prisma.user.create({
      data: { name: "현재 대표자", phoneNumber: representativePhone },
    });
    const representativeStudent = await prisma.student.create({
      data: {
        name: representative.name,
        number: 20260002,
        userId: representative.id,
      },
    });
    const club = await prisma.club.create({
      data: {
        nameKr: body.clubNameKr,
        nameEn: body.clubNameEn,
        divisionId: body.divisionId,
        foundingYear: 2026,
      },
    });
    const term = {
      clubId: club.id,
      startTerm: new Date("2026-01-01T00:00:00Z"),
    };
    await prisma.clubDelegateD.createMany({
      data: [
        {
          ...term,
          studentId: representativeStudent.id,
          clubDelegateEnum: ClubDelegateEnum.Representative,
        },
        {
          ...term,
          studentId: applicant.studentId,
          clubDelegateEnum: ClubDelegateEnum.Delegate1,
        },
      ],
    });
    jest
      .spyOn(
        service,
        "getStudentRegistrationClubRegistrationQualificationRenewal",
      )
      .mockResolvedValueOnce({
        clubs: [
          {
            id: club.id,
            clubNameKr: body.clubNameKr,
            clubNameEn: body.clubNameEn,
          },
        ],
      });

    const renewal = {
      ...body,
      clubId: club.id,
      registrationTypeEnumId: RegistrationTypeEnum.Renewal,
    };
    const { id } = await service.postStudentRegistrationClubRegistration(
      applicant,
      renewal,
    );
    await expect(readUser()).resolves.toMatchObject({
      phoneNumber: submittedPhone,
    });

    await service.putStudentRegistrationsClubRegistration(applicant, id, {
      ...renewal,
      phoneNumber: changedPhone,
    });
    await expect(readUser()).resolves.toMatchObject({
      phoneNumber: changedPhone,
    });
    await expect(readRegistration(id)).resolves.toMatchObject({
      studentId: applicant.studentId,
      phoneNumber: changedPhone,
    });
    await expect(
      prisma.user.findUniqueOrThrow({ where: { id: representative.id } }),
    ).resolves.toMatchObject({ phoneNumber: representativePhone });
  });

  it("rolls back the new application and user number on submit failure", async () => {
    failAfterUpdatingUser();
    await expect(
      service.postStudentRegistrationClubRegistration(applicant, body),
    ).rejects.toThrow("전화번호 저장 실패");
    await expect(prisma.registration.count()).resolves.toBe(0);
    await expect(readUser()).resolves.toMatchObject({
      phoneNumber: originalPhone,
    });
  });

  it("rolls back the application edit and user number on update failure", async () => {
    const { id } = await service.postStudentRegistrationClubRegistration(
      applicant,
      body,
    );
    failAfterUpdatingUser();
    await expect(
      service.putStudentRegistrationsClubRegistration(applicant, id, {
        ...body,
        phoneNumber: changedPhone,
        activityPlan: "실패한 활동 계획",
      }),
    ).rejects.toThrow("전화번호 저장 실패");
    await expect(readRegistration(id)).resolves.toMatchObject({
      phoneNumber: submittedPhone,
      activityPlan: body.activityPlan,
    });
    await expect(readUser()).resolves.toMatchObject({
      phoneNumber: submittedPhone,
    });
  });
});
