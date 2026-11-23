import { ProfessorApprovalStatus } from "@clubs/domain/activity/activity";

import apiReg021 from "@clubs/interface/api/registration/endpoint/apiReg021";
import apiReg022 from "@clubs/interface/api/registration/endpoint/apiReg022";
import { ClubTypeEnum } from "@clubs/interface/common/enum/club.enum";
import {
  RegistrationDeadlineEnum,
  RegistrationStatusEnum,
  RegistrationTypeEnum,
} from "@clubs/interface/common/enum/registration.enum";

import { OrderByTypeEnum } from "@sparcs-clubs/api/common/enums";

import { RegistrationService } from "./registration.service";

jest.mock("@nestjs-cls/transactional", () => ({
  Transactional: () => () => undefined,
}));

type RegistrationServiceDependencies = ConstructorParameters<
  typeof RegistrationService
>;

const clubId = 201;
const studentId = 301;
const semesterId = 7;

const createService = (clubTypeEnum: ClubTypeEnum) => {
  const clubRegistrationRepository = {
    selectRegistrationsAndRepresentativeByProfessorId: jest.fn(),
    selectRegistrationsById: jest.fn(),
    getProfessorRegistrationsClubRegistration: jest.fn(),
    recordProfessorApproval: jest.fn(),
    postExecutiveRegistrationsClubRegistrationSendBack: jest.fn(),
  };
  const clubPublicService = {
    getClubByClubId: jest.fn().mockResolvedValue([{ id: clubId }]),
    getClubSummariesByClubIdAndSemesterIds: jest.fn().mockResolvedValue([
      {
        id: clubId,
        typeEnum: clubTypeEnum,
      },
    ]),
    isStudentBelongsTo: jest.fn().mockResolvedValue(false),
    fetchSummaries: jest.fn(),
    fetchDivisionSummaries: jest
      .fn()
      .mockResolvedValue([{ id: 1, name: "분과" }]),
    isPermanentClubsByClubId: jest.fn().mockResolvedValue(false),
  };
  const userPublicService = {
    isNotGraduateStudent: jest.fn().mockResolvedValue(true),
    getStudentEnumsByIdsAndSemesterIdWithRollover: jest.fn(),
    getStudentMapByIds: jest.fn(),
    getStudentById: jest.fn(),
  };
  const memberRegistrationRepository = {
    find: jest.fn().mockResolvedValue([]),
    createPending: jest.fn().mockResolvedValue(undefined),
  };
  const semesterPublicService = {
    loadId: jest.fn().mockResolvedValue(semesterId),
    getById: jest.fn().mockResolvedValue({ id: semesterId }),
  };
  const registrationDeadlinePublicService = {
    search: jest.fn().mockResolvedValue([]),
    validate: jest.fn().mockResolvedValue(undefined),
  };
  const registrationPublicService = {
    checkDeadline: jest.fn().mockResolvedValue(undefined),
  };
  const service = new RegistrationService(
    clubRegistrationRepository as RegistrationServiceDependencies[0],
    clubPublicService as RegistrationServiceDependencies[1],
    {} as RegistrationServiceDependencies[2],
    {} as RegistrationServiceDependencies[3],
    registrationPublicService as RegistrationServiceDependencies[4],
    userPublicService as RegistrationServiceDependencies[5],
    memberRegistrationRepository as RegistrationServiceDependencies[6],
    semesterPublicService as RegistrationServiceDependencies[7],
    registrationDeadlinePublicService as RegistrationServiceDependencies[8],
    {} as RegistrationServiceDependencies[9],
  );

  return {
    service,
    clubRegistrationRepository,
    memberRegistrationRepository,
    userPublicService,
    clubPublicService,
    registrationDeadlinePublicService,
    registrationPublicService,
  };
};

describe("RegistrationService member registration availability", () => {
  it.each([ClubTypeEnum.Regular, ClubTypeEnum.Provisional])(
    "allows member registration for active club type %i",
    async clubTypeEnum => {
      const { service, memberRegistrationRepository } =
        createService(clubTypeEnum);

      await service.postMemberRegistration(studentId, clubId);

      expect(memberRegistrationRepository.createPending).toHaveBeenCalledWith(
        studentId,
        clubId,
        semesterId,
      );
    },
  );

  it("rejects member registration for a registration-canceled club", async () => {
    const { service, memberRegistrationRepository } = createService(
      ClubTypeEnum.RegistrationCanceled,
    );

    await expect(
      service.postMemberRegistration(studentId, clubId),
    ).rejects.toThrow("The club is not operating in the current semester.");
    expect(memberRegistrationRepository.createPending).not.toHaveBeenCalled();
  });
});

describe("RegistrationService club registration review", () => {
  it("does not send an approved registration back", async () => {
    const { service, clubRegistrationRepository } = createService(
      ClubTypeEnum.Regular,
    );
    clubRegistrationRepository.selectRegistrationsById.mockResolvedValue([
      {
        registrationApplicationStatusEnumId: RegistrationStatusEnum.Approved,
      },
    ]);

    await expect(
      service.postExecutiveRegistrationsClubRegistrationSendBack(
        1,
        1,
        "반려 사유",
      ),
    ).rejects.toThrow("Approved registration cannot be sent back");
    expect(
      clubRegistrationRepository.postExecutiveRegistrationsClubRegistrationSendBack,
    ).not.toHaveBeenCalled();
  });
});

describe("RegistrationService professor club registration brief", () => {
  it("preserves semesters and recognizes existing signatures before the approval status backfill", async () => {
    const { service, clubRegistrationRepository } = createService(
      ClubTypeEnum.Regular,
    );
    const expected = [
      {
        id: 1,
        semesterId,
        professorSignedAt: null,
        professorApprovalStatus: ProfessorApprovalStatus.Pending,
      },
      {
        id: 2,
        semesterId: semesterId - 1,
        professorSignedAt: new Date("2026-09-14T00:00:00.000Z"),
        professorApprovalStatus: ProfessorApprovalStatus.LateApproved,
      },
      {
        id: 3,
        semesterId: null,
        professorSignedAt: new Date("2026-09-12T00:00:00.000Z"),
        professorApprovalStatus: ProfessorApprovalStatus.Approved,
      },
    ];
    clubRegistrationRepository.selectRegistrationsAndRepresentativeByProfessorId.mockResolvedValue(
      expected.map(item => ({
        registration: {
          id: item.id,
          clubId,
          semesterId: item.semesterId,
          registrationApplicationStatusEnumId: RegistrationStatusEnum.Approved,
          divisionId: item.id,
          clubNameKr: "동아리",
          clubNameEn: "Club",
          professorApprovedAt: item.professorSignedAt,
          professorApprovalStatus:
            item.id === 3
              ? ProfessorApprovalStatus.Pending
              : ProfessorApprovalStatus.LateApproved,
        },
        club: { nameKr: "동아리", nameEn: "Club" },
        division: { name: "분과" },
        student: {
          id: studentId,
          number: 20260001,
          name: "학생",
          email: "student@kaist.ac.kr",
        },
        user: {},
      })),
    );

    const response =
      await service.getProfessorRegistrationsClubRegistrationsBrief({
        professorId: 1,
      });
    const parsed = apiReg021.responseBodyMap[200].parse(
      JSON.parse(JSON.stringify(response)),
    );

    expect(parsed.items).toMatchObject(expected);
    expect(
      clubRegistrationRepository.selectRegistrationsAndRepresentativeByProfessorId,
    ).toHaveBeenCalledWith({ professorId: 1 });
  });
});

describe("RegistrationService professor club registration detail", () => {
  it("returns both approval states and the final deadlines of the application semester", async () => {
    const {
      clubRegistrationRepository,
      registrationDeadlinePublicService,
      service,
    } = createService(ClubTypeEnum.Regular);
    const regularDeadline = new Date("2026-09-01T12:00:00.000Z");
    const lateSigningDeadline = new Date("2026-09-14T12:00:00.000Z");
    const signedAt = new Date("2026-09-20T12:00:00.000Z");
    registrationDeadlinePublicService.search
      .mockResolvedValueOnce([
        { endTerm: regularDeadline },
        { endTerm: new Date("2026-08-30T12:00:00.000Z") },
      ])
      .mockResolvedValueOnce([{ endTerm: lateSigningDeadline }]);
    clubRegistrationRepository.getProfessorRegistrationsClubRegistration.mockResolvedValue(
      {
        registration: {
          id: 2,
          clubId,
          semesterId: semesterId - 1,
          registrationApplicationTypeEnumId: RegistrationTypeEnum.Renewal,
          registrationApplicationStatusEnumId: RegistrationStatusEnum.Rejected,
          clubNameKr: "동아리",
          clubNameEn: "Club",
          phoneNumber: "010-1234-5678",
          foundedAt: new Date("2026-01-01T00:00:00.000Z"),
          divisionId: 1,
          activityFieldKr: "활동",
          activityFieldEn: "Activities",
          registrationActivityPlanFileId: null,
          registrationClubRuleFileId: null,
          registrationExternalInstructionFileId: null,
          professorApprovedAt: signedAt,
          professorApprovalStatus: ProfessorApprovalStatus.LateApproved,
          updatedAt: signedAt,
        },
        club: { nameKr: "동아리", nameEn: "Club" },
        student: { name: "학생", number: 20260001 },
        professor: { name: "교수", email: "professor@kaist.ac.kr" },
        professor_t: { professorEnum: null },
        comments: [],
      },
    );

    const detail = await service.getProfessorRegistrationsClubRegistration({
      registrationId: 2,
      professorId: 1,
    });

    expect(
      apiReg022.responseBodyMap[200].parse(JSON.parse(JSON.stringify(detail))),
    ).toMatchObject({
      registrationStatusEnumId: RegistrationStatusEnum.Rejected,
      isProfessorSigned: true,
      professorApprovalStatus: ProfessorApprovalStatus.LateApproved,
      professorSignedAt: signedAt,
      professor: { professorEnumId: null },
      regularDeadline,
      lateSigningDeadline,
    });
    expect(registrationDeadlinePublicService.search.mock.calls).toEqual([
      [
        {
          semesterId: semesterId - 1,
          deadlineEnum: RegistrationDeadlineEnum.ClubRegistrationApplication,
        },
      ],
      [
        {
          semesterId: semesterId - 1,
          deadlineEnum: RegistrationDeadlineEnum.ClubRegistrationLate,
        },
      ],
    ]);
  });
});

describe("RegistrationService professor club registration approval", () => {
  const deadline = new Date("2026-09-01T12:00:00.000Z");
  const { Approved, LateApproved } = ProfessorApprovalStatus;

  it.each([
    { now: "2026-09-01T11:59:59.999Z", endTerm: deadline, status: Approved },
    {
      now: "2026-09-01T12:00:00.000Z",
      endTerm: deadline,
      status: LateApproved,
    },
    {
      now: "2026-10-01T00:00:00.000Z",
      endTerm: deadline,
      status: LateApproved,
    },
    { now: "2026-10-01T00:00:00.000Z", endTerm: null, status: Approved },
  ])(
    "signs at $now and stores $status with regular cutoff $endTerm",
    async ({ now, endTerm, status }) => {
      const {
        service,
        clubRegistrationRepository,
        registrationDeadlinePublicService,
        registrationPublicService,
      } = createService(ClubTypeEnum.Regular);
      const approvedAt = new Date(now);
      Object.assign(service, { clock: { now: () => approvedAt } });
      registrationPublicService.checkDeadline.mockRejectedValue(
        new Error("Application deadline has passed"),
      );
      clubRegistrationRepository.selectRegistrationsById.mockResolvedValue([
        {
          professorId: 1,
          semesterId: semesterId - 1,
          professorApprovedAt: null,
        },
      ]);
      registrationDeadlinePublicService.search.mockResolvedValue(
        endTerm ? [{ endTerm: new Date(0) }, { endTerm }] : [],
      );

      await expect(
        service.getProfessorRegistrationsClubRegistrationApproval({
          professorId: 1,
          param: { applyId: 2 },
        }),
      ).resolves.toEqual({});
      expect(registrationPublicService.checkDeadline).not.toHaveBeenCalled();
      expect(registrationDeadlinePublicService.search).toHaveBeenCalledTimes(1);
      expect(registrationDeadlinePublicService.search).toHaveBeenCalledWith({
        semesterId: semesterId - 1,
        deadlineEnum: RegistrationDeadlineEnum.ClubRegistrationApplication,
      });
      expect(
        clubRegistrationRepository.recordProfessorApproval,
      ).toHaveBeenCalledWith({
        registrationId: 2,
        professorId: 1,
        approvalStatus: status,
        approvedAt,
      });
    },
  );

  it.each([
    {
      name: "a missing registration",
      registrations: [],
      message: "no such registration-apply",
    },
    {
      name: "another professor's registration",
      registrations: [{ professorId: 2, professorApprovedAt: null }],
      message: "It seems that you are not a advisor of the club",
    },
    {
      name: "an already signed registration",
      registrations: [{ professorId: 1, professorApprovedAt: new Date() }],
      message: "It seems already approved",
    },
  ])("rejects $name", async ({ registrations, message }) => {
    const { service, clubRegistrationRepository } = createService(
      ClubTypeEnum.Regular,
    );
    clubRegistrationRepository.selectRegistrationsById.mockResolvedValue(
      registrations,
    );

    await expect(
      service.getProfessorRegistrationsClubRegistrationApproval({
        professorId: 1,
        param: { applyId: 2 },
      }),
    ).rejects.toThrow(message);
    expect(
      clubRegistrationRepository.recordProfessorApproval,
    ).not.toHaveBeenCalled();
  });

  it("still rejects student submissions after the application deadline", async () => {
    const { service, registrationPublicService } = createService(
      ClubTypeEnum.Regular,
    );
    registrationPublicService.checkDeadline.mockRejectedValue(
      new Error("Application deadline has passed"),
    );

    await expect(
      service.postStudentRegistrationClubRegistration(
        { userId: 100, studentId },
        {} as Parameters<
          RegistrationService["postStudentRegistrationClubRegistration"]
        >[1],
      ),
    ).rejects.toThrow("Application deadline has passed");
  });
});

describe("RegistrationService executive member classification", () => {
  const students = [
    { id: 1, studentEnumId: 1, studentNumber: "20250001" },
    { id: 2, studentEnumId: 1, studentNumber: "20256000" },
    { id: 3, studentEnumId: 2, studentNumber: "20252000" },
    { id: 4, studentEnumId: 3, studentNumber: "20255000" },
    { id: 5, studentEnumId: undefined, studentNumber: "20250005" },
  ].map(student => ({
    ...student,
    name: `학생${student.id}`,
    email: `student${student.id}@kaist.ac.kr`,
    phoneNumber: "010-1234-5678",
  }));
  const registrations = students.flatMap(student =>
    [1, 2, 3].map(status => ({
      id: (student.id - 1) * 3 + status,
      student: { id: student.id },
      club: { id: clubId },
      registrationApplicationStudentEnum: status,
    })),
  );

  const createMemberService = () => {
    const context = createService(ClubTypeEnum.Regular);
    context.userPublicService.getStudentEnumsByIdsAndSemesterIdWithRollover.mockResolvedValue(
      students.slice(0, 4),
    );
    context.userPublicService.getStudentMapByIds.mockResolvedValue(
      new Map(
        students.map(student => [
          student.id,
          {
            id: student.id,
            studentNumber: student.studentNumber,
          },
        ]),
      ),
    );
    context.userPublicService.getStudentById.mockImplementation(
      async ({ id }) => ({
        ...students[id - 1],
        number: Number(students[id - 1].studentNumber),
      }),
    );
    return context;
  };

  it.each([1, 2, 3])(
    "uses all registrations for counts and paginates only rows on page %i",
    async pageOffset => {
      const { service, memberRegistrationRepository, userPublicService } =
        createMemberService();
      const page = registrations.slice((pageOffset - 1) * 5, pageOffset * 5);
      memberRegistrationRepository.find
        .mockResolvedValueOnce(page)
        .mockResolvedValueOnce(registrations);

      const result = await service.getExecutiveRegistrationsMemberRegistrations(
        {
          executiveId: 1,
          query: { clubId, pageOffset, itemCount: 5, semesterId },
        },
      );

      expect(result).toMatchObject({
        total: 15,
        offset: pageOffset,
        totalRegistrations: 15,
        totalWaitings: 5,
        totalApprovals: 5,
        totalRejections: 5,
        regularMemberRegistrations: 3,
        regularMemberWaitings: 1,
        regularMemberApprovals: 1,
        regularMemberRejections: 1,
      });
      expect(result.items).toEqual(
        page.map(registration => {
          const student = students[registration.student.id - 1];
          return {
            memberRegistrationId: registration.id,
            RegistrationApplicationStudentStatusEnumId:
              registration.registrationApplicationStudentEnum,
            isRegularMemberRegistration: registration.student.id === 1,
            student: {
              id: student.id,
              name: student.name,
              email: student.email,
              phoneNumber: student.phoneNumber,
              studentNumber: Number(student.studentNumber),
            },
          };
        }),
      );
      const studentIds = registrations.map(
        registration => registration.student.id,
      );
      expect(userPublicService.getStudentMapByIds).toHaveBeenCalledTimes(1);
      expect(userPublicService.getStudentMapByIds).toHaveBeenCalledWith(
        studentIds,
      );
      expect(
        userPublicService.getStudentEnumsByIdsAndSemesterIdWithRollover,
      ).toHaveBeenCalledWith(studentIds, semesterId);
      expect(memberRegistrationRepository.find).toHaveBeenNthCalledWith(1, {
        clubId,
        semesterId,
        pagination: { offset: pageOffset, itemCount: 5 },
        orderBy: { createdAt: OrderByTypeEnum.DESC },
      });
    },
  );

  it("uses the same rule for each club overview before paginating clubs", async () => {
    const { service, memberRegistrationRepository, clubPublicService } =
      createMemberService();
    memberRegistrationRepository.find.mockResolvedValue([
      ...registrations,
      { ...registrations[1], id: 16, club: { id: clubId + 1 } },
    ]);
    clubPublicService.fetchSummaries.mockResolvedValue(
      [clubId, clubId + 1].map(id => ({
        id,
        name: `동아리${id}`,
        typeEnum: ClubTypeEnum.Regular,
        division: { id: 1 },
      })),
    );

    const results = await Promise.all(
      [1, 2].map(pageOffset =>
        service.getExecutiveRegistrationsMemberRegistrationsBrief({
          executiveId: 1,
          query: { semesterId, pageOffset, itemCount: 1 },
        }),
      ),
    );
    expect(results[0]).toMatchObject({
      total: 2,
      offset: 1,
      items: [
        {
          clubId,
          totalRegistrations: 15,
          totalApprovals: 5,
          regularMemberRegistrations: 3,
          regularMemberApprovals: 1,
        },
      ],
    });
    expect(results[1]).toMatchObject({
      total: 2,
      offset: 2,
      items: [
        {
          clubId: clubId + 1,
          totalRegistrations: 1,
          totalApprovals: 1,
          regularMemberRegistrations: 1,
          regularMemberApprovals: 1,
        },
      ],
    });
  });
});
