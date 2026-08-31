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
    );

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
      date: semester.startTerm,
      semesterId,
      clubTypeEnum: [1, 2],
    });
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
