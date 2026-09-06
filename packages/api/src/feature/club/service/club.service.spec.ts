import { ClubService } from "./club.service";

jest.mock("@nestjs-cls/transactional", () => ({
  Transactional: () => () => undefined,
}));

type ClubServiceDependencies = ConstructorParameters<typeof ClubService>;

const now = new Date("2026-08-25T01:02:03.000Z");
const clubId = 201;
const semesterId = 7;

describe("ClubService getClubs", () => {
  it("returns clubs using the requested semester snapshot", async () => {
    const semester = {
      id: semesterId,
      year: 2025,
      name: "가을",
      startTerm: new Date("2025-09-01T00:00:00.000Z"),
      endTerm: new Date("2026-03-01T00:00:00.000Z"),
    };
    const clubOldRepository = {
      getAllClubsGroupedByDivision: jest.fn(),
    };
    const clubStudentTRepository = {
      findTotalMemberCnt: jest.fn().mockResolvedValue(12),
    };
    const divisionPermanentClubDRepository = {
      findPermenantClub: jest.fn().mockResolvedValue(true),
    };
    const clubPublicService = {
      searchClubDetailByDate: jest.fn().mockResolvedValue([
        {
          id: clubId,
          nameKr: "과거 동아리",
          nameEn: "Historical Club",
          clubTypeEnum: 1,
          characteristicKr: "역사",
          professor: { name: "지도교수" },
          clubRepresentative: { name: "대표자" },
          division: {
            id: 3,
            name: "학술",
            district: { id: 2 },
          },
        },
      ]),
    };
    const semesterPublicService = {
      getById: jest.fn().mockResolvedValue(semester),
    };
    const service = new ClubService(
      clubOldRepository as ClubServiceDependencies[0],
      {} as ClubServiceDependencies[1],
      {} as ClubServiceDependencies[2],
      clubStudentTRepository as ClubServiceDependencies[3],
      {} as ClubServiceDependencies[4],
      divisionPermanentClubDRepository as ClubServiceDependencies[5],
      {} as ClubServiceDependencies[6],
      {} as ClubServiceDependencies[7],
      clubPublicService as ClubServiceDependencies[8],
      {} as ClubServiceDependencies[9],
      semesterPublicService as ClubServiceDependencies[10],
      {} as ClubServiceDependencies[11],
      {} as ClubServiceDependencies[12],
      {} as ClubServiceDependencies[13],
      {} as ClubServiceDependencies[14],
    );
    Object.assign(service, { clock: { now: () => now } });
    const snapshotDate = new Date(semester.endTerm.getTime() - 1);

    await expect(service.getClubs({ semesterId })).resolves.toEqual({
      divisions: [
        {
          id: 3,
          name: "학술",
          clubs: [
            {
              id: clubId,
              nameKr: "과거 동아리",
              nameEn: "Historical Club",
              type: 1,
              isPermanent: true,
              characteristic: "역사",
              representative: "대표자",
              advisor: "지도교수",
              totalMemberCnt: 12,
            },
          ],
        },
      ],
    });
    expect(clubPublicService.searchClubDetailByDate).toHaveBeenCalledWith({
      date: snapshotDate,
      semesterId,
      clubTypeEnum: [1, 2],
    });
    expect(
      divisionPermanentClubDRepository.findPermenantClub,
    ).toHaveBeenCalledWith(clubId, snapshotDate);
    expect(
      clubOldRepository.getAllClubsGroupedByDivision,
    ).not.toHaveBeenCalled();
  });
});

describe("ClubService cancelRegistration", () => {
  it("coordinates registration cancellation repositories", async () => {
    const clubSemesterRepository = {
      cancelRegistration: jest.fn().mockResolvedValue(semesterId),
    };
    const clubDelegateRepository = {
      endCurrentTerms: jest.fn().mockResolvedValue(undefined),
    };
    const clubDelegateChangeRequestRepository = {
      cancelAppliedRequests: jest.fn().mockResolvedValue(undefined),
    };
    const registrationPublicService = {
      rejectPendingMemberRegistrations: jest.fn().mockResolvedValue(undefined),
    };
    const service = new ClubService(
      {} as ClubServiceDependencies[0],
      {} as ClubServiceDependencies[1],
      {} as ClubServiceDependencies[2],
      {} as ClubServiceDependencies[3],
      {} as ClubServiceDependencies[4],
      {} as ClubServiceDependencies[5],
      {} as ClubServiceDependencies[6],
      {} as ClubServiceDependencies[7],
      {} as ClubServiceDependencies[8],
      registrationPublicService as ClubServiceDependencies[9],
      {} as ClubServiceDependencies[10],
      clubSemesterRepository as ClubServiceDependencies[11],
      clubDelegateRepository as ClubServiceDependencies[12],
      clubDelegateChangeRequestRepository as ClubServiceDependencies[13],
      {} as ClubServiceDependencies[14],
    );
    Object.assign(service, { clock: { now: () => now } });

    await expect(service.cancelRegistration(clubId)).resolves.toEqual({});
    expect(clubSemesterRepository.cancelRegistration).toHaveBeenCalledWith(
      clubId,
      now,
    );
    expect(clubDelegateRepository.endCurrentTerms).toHaveBeenCalledWith(
      clubId,
      now,
    );
    expect(
      clubDelegateChangeRequestRepository.cancelAppliedRequests,
    ).toHaveBeenCalledWith(clubId, now);
    expect(
      registrationPublicService.rejectPendingMemberRegistrations,
    ).toHaveBeenCalledWith(clubId, semesterId);
  });
});

describe("ClubService registration delegate change", () => {
  const registrationSemester = {
    id: 20,
    year: 2026,
    name: "가을",
  };
  const previousSemester = {
    id: 19,
    year: 2026,
    name: "봄",
    endTerm: new Date("2026-08-28T14:59:00.000Z"),
  };

  const createService = ({
    clubStudentTRepository = {},
    clubPublicService = {},
    registrationPublicService = {},
    semesterPublicService = {},
    clubDelegateRepository = {},
    userPublicService = {},
  }: Partial<{
    clubStudentTRepository: object;
    clubPublicService: object;
    registrationPublicService: object;
    semesterPublicService: object;
    clubDelegateRepository: object;
    userPublicService: object;
  }>) => {
    const service = new ClubService(
      {} as ClubServiceDependencies[0],
      {} as ClubServiceDependencies[1],
      {} as ClubServiceDependencies[2],
      clubStudentTRepository as ClubServiceDependencies[3],
      {} as ClubServiceDependencies[4],
      {} as ClubServiceDependencies[5],
      {} as ClubServiceDependencies[6],
      {} as ClubServiceDependencies[7],
      clubPublicService as ClubServiceDependencies[8],
      registrationPublicService as ClubServiceDependencies[9],
      semesterPublicService as ClubServiceDependencies[10],
      {} as ClubServiceDependencies[11],
      clubDelegateRepository as ClubServiceDependencies[12],
      {} as ClubServiceDependencies[13],
      userPublicService as ClubServiceDependencies[14],
    );
    Object.assign(service, { clock: { now: () => now } });
    return service;
  };

  it("lists only previous-semester clubs without a current registration", async () => {
    const clubPublicService = {
      searchClubDetailByDate: jest.fn().mockResolvedValue([
        {
          id: 1,
          nameKr: "미제출 동아리",
          nameEn: "Available",
          clubTypeEnum: 1,
          division: { name: "학술" },
          clubRepresentative: { name: "대표자" },
        },
        {
          id: 2,
          nameKr: "제출 동아리",
          nameEn: "Submitted",
          clubTypeEnum: 1,
          division: { name: "생활문화" },
          clubRepresentative: { name: "기존 대표자" },
        },
      ]),
    };
    const registrationPublicService = {
      isDeadline: jest.fn().mockResolvedValue(true),
      getRegisteredClubIds: jest.fn().mockResolvedValue([2]),
    };
    const semesterPublicService = {
      load: jest.fn().mockResolvedValue(registrationSemester),
      getById: jest.fn().mockResolvedValue(previousSemester),
    };
    const service = createService({
      clubPublicService,
      registrationPublicService,
      semesterPublicService,
    });

    const result = await service.getRegistrationDelegateChangeClubs();

    expect(result.clubs.map(club => club.id)).toEqual([1]);
    expect(result.effectiveAt).toEqual(new Date("2026-08-27T14:59:00.000Z"));
  });

  it("locks delegates and rechecks registration before changing the role", async () => {
    const clubStudentTRepository = {
      findByClubIdAndSemesterId: jest
        .fn()
        .mockResolvedValue([{ studentId: 30 }]),
    };
    const registrationPublicService = {
      checkDeadline: jest.fn().mockResolvedValue(undefined),
      isDeadline: jest.fn().mockResolvedValue(true),
      hasClubRegistration: jest.fn().mockResolvedValue(false),
    };
    const semesterPublicService = {
      load: jest.fn().mockResolvedValue(registrationSemester),
      getById: jest.fn().mockResolvedValue(previousSemester),
    };
    const clubDelegateRepository = {
      lockForRegistrationChange: jest.fn().mockResolvedValue(undefined),
      replaceForRegistration: jest.fn().mockResolvedValue(undefined),
    };
    const userPublicService = {
      getStudentEnumsByIdsAndSemesterId: jest
        .fn()
        .mockResolvedValue([{ id: 30, studentEnumId: 1 }]),
      getStudentsByIds: jest.fn().mockResolvedValue([{ id: 30, userId: 40 }]),
    };
    const service = createService({
      clubStudentTRepository,
      registrationPublicService,
      semesterPublicService,
      clubDelegateRepository,
      userPublicService,
    });

    await expect(
      service.changeRegistrationDelegate(
        { clubId },
        { studentId: 30, clubDelegateEnumId: 1 },
      ),
    ).resolves.toEqual({});
    expect(
      clubDelegateRepository.lockForRegistrationChange.mock
        .invocationCallOrder[0],
    ).toBeLessThan(
      registrationPublicService.hasClubRegistration.mock.invocationCallOrder[0],
    );
    expect(
      registrationPublicService.hasClubRegistration.mock.invocationCallOrder[0],
    ).toBeLessThan(
      clubDelegateRepository.replaceForRegistration.mock.invocationCallOrder[0],
    );
  });

  it("does not change a role outside the club registration period", async () => {
    const registrationPublicService = {
      checkDeadline: jest.fn().mockRejectedValue(new Error("outside deadline")),
    };
    const clubDelegateRepository = {
      replaceForRegistration: jest.fn(),
    };
    const service = createService({
      registrationPublicService,
      clubDelegateRepository,
    });

    await expect(
      service.changeRegistrationDelegate(
        { clubId },
        { studentId: 30, clubDelegateEnumId: 1 },
      ),
    ).rejects.toThrow("outside deadline");
    expect(
      clubDelegateRepository.replaceForRegistration,
    ).not.toHaveBeenCalled();
  });

  it("does not change a role after registration documents are submitted", async () => {
    const clubStudentTRepository = {
      findByClubIdAndSemesterId: jest
        .fn()
        .mockResolvedValue([{ studentId: 30 }]),
    };
    const registrationPublicService = {
      checkDeadline: jest.fn().mockResolvedValue(undefined),
      isDeadline: jest.fn().mockResolvedValue(true),
      hasClubRegistration: jest.fn().mockResolvedValue(true),
    };
    const semesterPublicService = {
      load: jest.fn().mockResolvedValue(registrationSemester),
      getById: jest.fn().mockResolvedValue(previousSemester),
    };
    const clubDelegateRepository = {
      lockForRegistrationChange: jest.fn().mockResolvedValue(undefined),
      replaceForRegistration: jest.fn(),
    };
    const userPublicService = {
      getStudentEnumsByIdsAndSemesterId: jest
        .fn()
        .mockResolvedValue([{ id: 30, studentEnumId: 1 }]),
      getStudentsByIds: jest.fn().mockResolvedValue([{ id: 30, userId: 40 }]),
    };
    const service = createService({
      clubStudentTRepository,
      registrationPublicService,
      semesterPublicService,
      clubDelegateRepository,
      userPublicService,
    });

    await expect(
      service.changeRegistrationDelegate(
        { clubId },
        { studentId: 30, clubDelegateEnumId: 1 },
      ),
    ).rejects.toThrow("Club registration already exists");
    expect(
      clubDelegateRepository.replaceForRegistration,
    ).not.toHaveBeenCalled();
  });
});
