import { ClubDelegateChangeRequestStatusEnum } from "@clubs/domain/club/club-delegate-change-request";
import { ClubTypeEnum } from "@clubs/domain/club/club-semester";

import { ClubDelegateChangeRequestRepository } from "./club-delegate-change-request.repository";
import { ClubDelegateRepository } from "./club-delegate-repository";
import { ClubSemesterRepository } from "./club-semester.repository";

const now = new Date("2026-08-25T01:02:03.000Z");
const clubId = 201;
const semesterId = 7;

const createRepositories = (clubTCount = 1) => {
  const tx = {
    clubT: {
      findFirst: jest.fn().mockResolvedValue({ semesterId }),
      updateMany: jest.fn().mockResolvedValue({ count: clubTCount }),
    },
    clubDelegateD: {
      updateMany: jest.fn().mockResolvedValue({ count: 3 }),
    },
    clubDelegateChangeRequest: {
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
  };
  const txHost = { tx };

  return {
    tx,
    clubSemesterRepository: new ClubSemesterRepository(txHost as never),
    clubDelegateRepository: new ClubDelegateRepository(txHost as never),
    clubDelegateChangeRequestRepository:
      new ClubDelegateChangeRequestRepository(txHost as never),
  };
};

describe("club registration cancellation repositories", () => {
  it("updates the club and delegates with the same time", async () => {
    const {
      tx,
      clubSemesterRepository,
      clubDelegateRepository,
      clubDelegateChangeRequestRepository,
    } = createRepositories();

    await expect(
      clubSemesterRepository.cancelRegistration(clubId, now),
    ).resolves.toBe(semesterId);
    await clubDelegateRepository.endCurrentTerms(clubId, now);
    await clubDelegateChangeRequestRepository.cancelAppliedRequests(
      clubId,
      now,
    );

    const activeClubTWhere = {
      clubId,
      clubStatusEnumId: {
        in: [ClubTypeEnum.Regular, ClubTypeEnum.Provisional],
      },
      startTerm: { lte: now },
      OR: [{ endTerm: { gte: now } }, { endTerm: null }],
      deletedAt: null,
    };
    expect(tx.clubT.updateMany).toHaveBeenCalledWith({
      where: activeClubTWhere,
      data: {
        clubStatusEnumId: ClubTypeEnum.RegistrationCanceled,
        endTerm: now,
      },
    });
    expect(tx.clubDelegateD.updateMany).toHaveBeenCalledWith({
      where: {
        clubId,
        startTerm: { lte: now },
        OR: [{ endTerm: { gte: now } }, { endTerm: null }],
        deletedAt: null,
      },
      data: { endTerm: now },
    });
    expect(tx.clubDelegateChangeRequest.updateMany).toHaveBeenCalledWith({
      where: {
        clubId,
        clubDelegateChangeRequestStatusEnumId:
          ClubDelegateChangeRequestStatusEnum.Applied,
        deletedAt: null,
      },
      data: { deletedAt: now },
    });
  });

  it("rejects when no active club semester exists", async () => {
    const { tx, clubSemesterRepository } = createRepositories();
    tx.clubT.findFirst.mockResolvedValue(null);

    await expect(
      clubSemesterRepository.cancelRegistration(clubId, now),
    ).rejects.toThrow("Club registration cannot be canceled");
    expect(tx.clubT.updateMany).not.toHaveBeenCalled();
  });

  it.each([0, 2])(
    "rejects when %i active club semester rows are updated",
    async clubTCount => {
      const { clubSemesterRepository } = createRepositories(clubTCount);

      await expect(
        clubSemesterRepository.cancelRegistration(clubId, now),
      ).rejects.toThrow("Club registration cannot be canceled");
    },
  );
});
