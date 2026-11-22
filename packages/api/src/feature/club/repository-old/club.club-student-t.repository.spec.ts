import { ClubDelegateEnum } from "@clubs/domain/club/club-delegate";
import { ClubDelegateChangeRequestStatusEnum } from "@clubs/domain/club/club-delegate-change-request";

import ClubStudentTRepository from "./club.club-student-t.repository";

jest.mock("@nestjs-cls/transactional", () => ({
  ...jest.requireActual("@nestjs-cls/transactional"),
  Transactional: () => () => undefined,
}));

const clubId = 42;
const studentId = 100;
const semesterId = 19;
const now = new Date("2026-09-08T00:00:00.000Z");

function createContext() {
  const tx = {
    $queryRawUnsafe: jest.fn(),
    club: { findMany: jest.fn().mockResolvedValue([{ id: clubId }]) },
    student: { findMany: jest.fn().mockResolvedValue([{ id: studentId }]) },
    clubDelegateD: {
      findMany: jest
        .fn()
        .mockResolvedValue([{ clubDelegateEnum: ClubDelegateEnum.Delegate1 }]),
      deleteMany: jest.fn(),
    },
    clubStudentT: { deleteMany: jest.fn() },
    clubDelegateChangeRequest: { updateMany: jest.fn() },
  };
  const repository = new ClubStudentTRepository({ tx } as never);
  Object.assign(repository, { clock: { now: () => now } });
  return { repository, tx };
}

describe("ClubStudentTRepository removeStudentFromClub", () => {
  it("checks the active role after taking locks before rejecting a member registration", async () => {
    const { repository, tx } = createContext();
    await expect(
      repository.removeStudentFromClub(studentId, clubId, semesterId, false),
    ).rejects.toThrow("club delegate cannot be rejected");

    expect(tx.$queryRawUnsafe.mock.invocationCallOrder[1]).toBeLessThan(
      tx.clubDelegateD.findMany.mock.invocationCallOrder[0],
    );
    expect(tx.clubDelegateD.deleteMany).not.toHaveBeenCalled();
    expect(tx.clubStudentT.deleteMany).not.toHaveBeenCalled();
    expect(tx.clubDelegateChangeRequest.updateMany).not.toHaveBeenCalled();
  });

  it("invalidates the request recipient and the affected role when an officer is removed", async () => {
    const { repository, tx } = createContext();
    await repository.removeStudentFromClub(studentId, clubId, semesterId, true);

    expect(tx.clubDelegateD.deleteMany).toHaveBeenCalled();
    expect(tx.clubStudentT.deleteMany).toHaveBeenCalled();
    expect(tx.clubDelegateChangeRequest.updateMany).toHaveBeenCalledWith({
      where: {
        clubId,
        clubDelegateChangeRequestStatusEnumId:
          ClubDelegateChangeRequestStatusEnum.Applied,
        deletedAt: null,
        OR: [
          { studentId },
          { clubDelegateEnumId: { in: [ClubDelegateEnum.Delegate1] } },
        ],
      },
      data: { deletedAt: now },
    });
  });
});
