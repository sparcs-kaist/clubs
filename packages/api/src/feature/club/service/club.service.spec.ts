import { ClubService } from "./club.service";

jest.mock("@nestjs-cls/transactional", () => ({
  Transactional: () => () => undefined,
}));

type ClubServiceDependencies = ConstructorParameters<typeof ClubService>;

const now = new Date("2026-08-25T01:02:03.000Z");
const clubId = 201;
const semesterId = 7;

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
