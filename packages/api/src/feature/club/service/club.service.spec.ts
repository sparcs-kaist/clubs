import {
  ClubDelegateChangeRequestStatusEnum,
  ClubTypeEnum,
} from "@clubs/interface/common/enum/club.enum";
import { RegistrationApplicationStudentStatusEnum } from "@clubs/interface/common/enum/registration.enum";

import { ClubService } from "./club.service";

jest.mock("@nestjs-cls/transactional", () => ({
  Transactional: () => () => undefined,
}));

type ClubServiceDependencies = ConstructorParameters<typeof ClubService>;

const now = new Date("2026-08-25T01:02:03.000Z");
const clubId = 201;
const semesterId = 7;

const createService = (clubTCount = 1) => {
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
    registrationApplicationStudent: {
      updateMany: jest.fn().mockResolvedValue({ count: 2 }),
    },
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
    {} as ClubServiceDependencies[9],
    {} as ClubServiceDependencies[10],
    { tx } as unknown as ClubServiceDependencies[11],
  );
  Object.assign(service, { clock: { now: () => now } });

  return { service, tx };
};

describe("ClubService cancelRegistration", () => {
  it("ends the club and related active records at the same time", async () => {
    const { service, tx } = createService();

    await service.cancelRegistration(clubId);

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
    expect(tx.registrationApplicationStudent.updateMany).toHaveBeenCalledWith({
      where: {
        clubId,
        semesterId,
        registrationApplicationStudentEnum:
          RegistrationApplicationStudentStatusEnum.Pending,
        deletedAt: null,
      },
      data: {
        registrationApplicationStudentEnum:
          RegistrationApplicationStudentStatusEnum.Rejected,
      },
    });
  });

  it.each([0, 2])(
    "rejects when %i active club semester rows are updated",
    async clubTCount => {
      const { service, tx } = createService(clubTCount);

      await expect(service.cancelRegistration(clubId)).rejects.toThrow(
        "Club registration cannot be canceled",
      );
      expect(tx.clubDelegateD.updateMany).not.toHaveBeenCalled();
    },
  );
});
