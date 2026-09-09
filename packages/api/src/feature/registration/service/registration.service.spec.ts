import { ClubTypeEnum } from "@clubs/interface/common/enum/club.enum";
import { RegistrationStatusEnum } from "@clubs/interface/common/enum/registration.enum";

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
    selectRegistrationsById: jest.fn(),
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
