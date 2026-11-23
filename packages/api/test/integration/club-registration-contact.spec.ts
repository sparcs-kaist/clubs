import { Test, TestingModule } from "@nestjs/testing";

import { ProfessorApprovalStatus } from "@clubs/domain/activity/activity";

import type { ApiReg001RequestBody } from "@clubs/interface/api/registration/endpoint/apiReg001";
import { RegistrationErrorCode } from "@clubs/interface/api/registration/type/registration-error";
import { ClubDelegateEnum } from "@clubs/interface/common/enum/club.enum";
import {
  RegistrationDeadlineEnum,
  RegistrationStatusEnum,
  RegistrationTypeEnum,
} from "@clubs/interface/common/enum/registration.enum";
import { ProfessorEnum } from "@clubs/interface/common/enum/user.enum";

import { CLOCK, Clock } from "@sparcs-clubs/api/common/clock/clock";
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
import { RegistrationDeadlineRepository } from "@sparcs-clubs/api/feature/semester/repository/registration.deadline.repository";
import OldProfessorRepository from "@sparcs-clubs/api/feature/user/repository/old.professor.repository";
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
        RegistrationDeadlineRepository,
        RegistrationDeadlinePublicService,
        RegistrationService,
        OldProfessorRepository,
        UserRepository,
        {
          provide: UserPublicService,
          inject: [UserRepository, OldProfessorRepository],
          useFactory: (
            repository: UserRepository,
            advisor: OldProfessorRepository,
          ) => ({
            updatePhoneNumber: repository.updatePhoneNumber.bind(repository),
            saveRegistrationAdvisor:
              advisor.saveRegistrationAdvisor.bind(advisor),
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
          useValue: {
            getFileInfoById: async (id: string) => ({ id, name: id }),
            getFileUrl: async (id: string) => `https://example.test/${id}`,
          },
        },
        {
          provide: RegistrationPublicService,
          useValue: { checkDeadline: jest.fn() },
        },
        {
          provide: SemesterPublicService,
          useValue: { loadId: async () => semesterId },
        },
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

  async function createAdvisedApplication() {
    const { id } = await service.postStudentRegistrationClubRegistration(
      applicant,
      {
        ...body,
        professor: { name: "지도교수", email: "advisor@kaist.ac.kr" },
      },
    );
    return readRegistration(id);
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

  it("does not edit or delete a previous-semester application during the current registration period", async () => {
    const { id } = await service.postStudentRegistrationClubRegistration(
      applicant,
      body,
    );
    const currentSemester = await prisma.semesterD.create({
      data: {
        year: 2027,
        name: "Spring",
        startTerm: new Date("2027-03-01T00:00:00Z"),
        endTerm: new Date("2027-08-31T00:00:00Z"),
      },
    });
    semesterId = currentSemester.id;

    await expect(
      service.putStudentRegistrationsClubRegistration(applicant, id, {
        ...body,
        phoneNumber: changedPhone,
      }),
    ).rejects.toMatchObject({
      response: { code: RegistrationErrorCode.ApplicationNotEditable },
    });
    await expect(
      service.deleteStudentRegistrationsClubRegistration(
        applicant.studentId,
        id,
      ),
    ).rejects.toMatchObject({ status: 404 });
    await expect(readRegistration(id)).resolves.toMatchObject({
      deletedAt: null,
      phoneNumber: submittedPhone,
    });
    await expect(readUser()).resolves.toMatchObject({
      phoneNumber: submittedPhone,
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

  it("keeps the existing professor rank when an application is edited", async () => {
    const application = await createAdvisedApplication();
    const where = { professorId: application.professorId! };
    await expect(
      prisma.professorT.findUnique({ where }),
    ).resolves.toMatchObject({
      professorEnum: null,
    });
    await prisma.professorT.update({
      where,
      data: { professorEnum: ProfessorEnum.Associate },
    });
    await service.putStudentRegistrationsClubRegistration(
      applicant,
      application.id,
      {
        ...body,
        clubId: application.clubId,
        professor: { name: "지도교수", email: "advisor@kaist.ac.kr" },
      },
    );
    await expect(
      prisma.professorT.findUnique({ where }),
    ).resolves.toMatchObject({
      professorEnum: ProfessorEnum.Associate,
    });
  });

  it("records a single late signature for concurrent requests after both deadlines", async () => {
    const application = await createAdvisedApplication();
    const signedAt = new Date("2026-10-01T00:00:00Z");
    const regularDeadline = new Date("2026-09-07T12:00:00Z");
    const lateSigningDeadline = new Date("2026-09-14T12:00:00Z");
    jest.spyOn(fixture.get<Clock>(CLOCK), "now").mockReturnValue(signedAt);
    await prisma.registrationDeadlineD.createMany({
      data: [
        {
          semesterId,
          deadlineEnum: RegistrationDeadlineEnum.ClubRegistrationApplication,
          startTerm: new Date("2026-09-01T00:00:00Z"),
          endTerm: regularDeadline,
        },
        {
          semesterId,
          deadlineEnum: RegistrationDeadlineEnum.ClubRegistrationLate,
          startTerm: regularDeadline,
          endTerm: lateSigningDeadline,
        },
      ],
    });
    const repository = fixture.get(ClubRegistrationRepository);
    const record = repository.recordProfessorApproval.bind(repository);
    let arrivals = 0;
    let release: () => void;
    const bothRequestsReady = new Promise<void>(resolve => {
      release = resolve;
    });
    jest
      .spyOn(repository, "recordProfessorApproval")
      .mockImplementation(async approval => {
        arrivals += 1;
        if (arrivals === 2) release();
        await bothRequestsReady;
        await record(approval);
      });
    const sign = () =>
      service.getProfessorRegistrationsClubRegistrationApproval({
        professorId: application.professorId!,
        param: { applyId: application.id },
      });
    const outcomes = await Promise.allSettled([sign(), sign()]);
    expect(
      outcomes.filter(outcome => outcome.status === "fulfilled"),
    ).toHaveLength(1);
    expect(outcomes).toContainEqual({
      status: "rejected",
      reason: expect.objectContaining({ status: 409 }),
    });
    await expect(readRegistration(application.id)).resolves.toMatchObject({
      professorApprovedAt: signedAt,
      professorApprovalStatus: ProfessorApprovalStatus.LateApproved,
      registrationApplicationStatusEnumId: RegistrationStatusEnum.Pending,
    });
    await expect(
      prisma.registrationProfessorApprovalLog.findMany({
        where: { registrationId: application.id },
      }),
    ).resolves.toEqual([
      expect.objectContaining({
        professorId: application.professorId,
        approvalStatus: ProfessorApprovalStatus.LateApproved,
        approvedAt: signedAt,
      }),
    ]);
    await expect(
      service.getProfessorRegistrationsClubRegistration({
        registrationId: application.id,
        professorId: application.professorId!,
      }),
    ).resolves.toMatchObject({
      professorSignedAt: signedAt,
      professorApprovalStatus: ProfessorApprovalStatus.LateApproved,
      regularDeadline,
      lateSigningDeadline,
    });
    await expect(
      service.getProfessorRegistrationsClubRegistrationsBrief({
        professorId: application.professorId!,
      }),
    ).resolves.toMatchObject({
      items: [
        {
          professorSignedAt: signedAt,
          professorApprovalStatus: ProfessorApprovalStatus.LateApproved,
        },
      ],
    });
  });

  it("resets one semester without changing a signed prior semester or its approval log", async () => {
    const previous = await createAdvisedApplication();
    await service.getProfessorRegistrationsClubRegistrationApproval({
      professorId: previous.professorId!,
      param: { applyId: previous.id },
    });
    const nextSemester = await prisma.semesterD.create({
      data: {
        year: 2027,
        name: "Spring",
        startTerm: new Date("2027-03-01T00:00:00Z"),
        endTerm: new Date("2027-08-31T00:00:00Z"),
      },
    });
    const current = await prisma.registration.create({
      data: {
        clubId: previous.clubId,
        studentId: previous.studentId,
        professorId: previous.professorId,
        semesterId: nextSemester.id,
        divisionId: previous.divisionId,
        foundedAt: body.foundedAt,
        registrationApplicationTypeEnumId: RegistrationTypeEnum.Renewal,
        registrationApplicationStatusEnumId: RegistrationStatusEnum.Approved,
      },
    });
    await service.getProfessorRegistrationsClubRegistrationApproval({
      professorId: previous.professorId!,
      param: { applyId: current.id },
    });
    const previousSigned = await readRegistration(previous.id);
    const logs = await prisma.registrationProfessorApprovalLog.findMany({
      orderBy: { id: "asc" },
    });
    expect(logs).toHaveLength(2);

    await fixture
      .get(ClubRegistrationRepository)
      .resetClubRegistrationStatusEnum(previous.clubId!, nextSemester.id);

    await expect(readRegistration(previous.id)).resolves.toEqual(
      previousSigned,
    );
    await expect(readRegistration(current.id)).resolves.toMatchObject({
      professorApprovedAt: null,
      professorApprovalStatus: ProfessorApprovalStatus.Pending,
      registrationApplicationStatusEnumId: RegistrationStatusEnum.Pending,
    });
    await expect(
      prisma.registrationProfessorApprovalLog.findMany({
        orderBy: { id: "asc" },
      }),
    ).resolves.toEqual(logs);
  });
});
