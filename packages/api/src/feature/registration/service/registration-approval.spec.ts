import { ClubDelegateEnum } from "@clubs/interface/common/enum/club.enum";
import {
  RegistrationApplicationStudentStatusEnum,
  RegistrationTypeEnum,
} from "@clubs/interface/common/enum/registration.enum";

import { ClubDelegateRepository } from "@sparcs-clubs/api/feature/club/repository/club-delegate-repository";
import { ClubDivisionHistoryRepository } from "@sparcs-clubs/api/feature/club/repository/club-division-history.repository";
import { ClubMemberRepository } from "@sparcs-clubs/api/feature/club/repository/club-member.repository";
import { ClubSemesterRepository } from "@sparcs-clubs/api/feature/club/repository/club-semester.repository";
import ClubPublicService from "@sparcs-clubs/api/feature/club/service/club.public.service";

import { ClubRegistrationApprovalRepository } from "../repository/club-registration-approval.repository";
import { MemberRegistrationRepository } from "../repository/member-registration.repository";
import { RegistrationService } from "./registration.service";

jest.mock("@nestjs-cls/transactional", () => ({
  ...jest.requireActual("@nestjs-cls/transactional"),
  Transactional: () => () => undefined,
}));

const approvedAt = new Date("2026-09-08T00:00:00.000Z");
const startTerm = new Date("2026-09-01T00:00:00.000Z");
const endTerm = new Date("2027-03-01T00:00:00.000Z");
const applicantId = 17160;
const clubId = 42;
const semesterId = 20;

function setup(registrationType = RegistrationTypeEnum.Renewal) {
  const tx = {
    registration: {
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      findFirst: jest.fn().mockResolvedValue({
        id: 100,
        clubId,
        semesterId,
        studentId: applicantId,
        registrationApplicationTypeEnumId: registrationType,
        divisionId: 1,
      }),
    },
    clubT: {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ startTerm, endTerm }),
    },
    clubDivisionHistory: {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
    },
    clubDelegateD: {
      findFirst: jest.fn().mockResolvedValue(null),
      updateMany: jest.fn().mockResolvedValue({ count: 2 }),
      create: jest.fn().mockResolvedValue({ id: 200 }),
    },
    registrationApplicationStudent: {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
      updateMany: jest.fn(),
    },
    clubStudentT: {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
    },
  };
  const txHost = { tx } as never;
  const clubPublicService = Object.create(ClubPublicService.prototype);
  Object.assign(clubPublicService, {
    clubDelegateRepository: new ClubDelegateRepository(txHost),
    clubSemesterRepository: new ClubSemesterRepository(txHost),
    clubDivisionHistoryRepository: new ClubDivisionHistoryRepository(txHost),
    clubMemberRepository: new ClubMemberRepository(txHost),
  });
  const getStudentsByIds = jest.fn().mockResolvedValue([{ id: applicantId }]);
  const checkDeadline = jest.fn();
  const service = new RegistrationService(
    {} as never,
    clubPublicService,
    {} as never,
    {} as never,
    { checkDeadline } as never,
    { getStudentsByIds } as never,
    new MemberRegistrationRepository(txHost),
    {
      getById: jest
        .fn()
        .mockResolvedValue({ id: semesterId, startTerm, endTerm }),
    } as never,
    {} as never,
    new ClubRegistrationApprovalRepository(txHost),
  );
  Object.assign(service, { clock: { now: () => approvedAt } });
  return { service, tx, getStudentsByIds, checkDeadline };
}

describe("club registration approval", () => {
  it.each([
    [RegistrationTypeEnum.Renewal, 1],
    [RegistrationTypeEnum.Promotional, 1],
    [RegistrationTypeEnum.NewProvisional, 2],
    [RegistrationTypeEnum.ReProvisional, 2],
  ])(
    "ends all current roles before registering the applicant for type %s",
    async (registrationType, clubStatusEnumId) => {
      const { service, tx, getStudentsByIds } = setup(registrationType);
      await service.patchExecutiveRegistrationsClubRegistrationApproval(100);

      expect(getStudentsByIds).toHaveBeenCalledWith([applicantId]);
      expect(tx.clubT.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ clubStatusEnumId }),
      });
      expect(tx.registrationApplicationStudent.create).toHaveBeenCalledWith({
        data: {
          studentId: applicantId,
          clubId,
          semesterId,
          registrationApplicationStudentEnum:
            RegistrationApplicationStudentStatusEnum.Approved,
        },
      });
      expect(tx.clubStudentT.create).toHaveBeenCalledWith({
        data: {
          studentId: applicantId,
          clubId,
          semesterId,
          startTerm,
          endTerm,
        },
      });
      expect(tx.clubDelegateD.create).toHaveBeenCalledWith({
        data: {
          clubId,
          studentId: applicantId,
          clubDelegateEnum: ClubDelegateEnum.Representative,
          startTerm: approvedAt,
        },
      });
      expect(tx.clubDelegateD.updateMany).toHaveBeenCalledWith({
        where: {
          clubId,
          startTerm: { lte: approvedAt },
          OR: [{ endTerm: { gte: approvedAt } }, { endTerm: null }],
          deletedAt: null,
        },
        data: { endTerm: approvedAt },
      });
      expect(tx.clubDelegateD.updateMany).toHaveBeenCalledTimes(1);
      expect(tx.clubDelegateD.create).toHaveBeenCalledTimes(1);
      expect(
        tx.clubDelegateD.updateMany.mock.invocationCallOrder[0],
      ).toBeLessThan(tx.clubDelegateD.create.mock.invocationCallOrder[0]);
    },
  );

  it("recreates an existing applicant representative while preserving membership and club term", async () => {
    const { service, tx } = setup(RegistrationTypeEnum.NewProvisional);
    tx.clubDelegateD.findFirst.mockImplementation(({ where }) =>
      where.clubId === clubId
        ? {
            id: 200,
            studentId: applicantId,
            clubDelegateEnum: ClubDelegateEnum.Representative,
          }
        : null,
    );
    tx.registrationApplicationStudent.findFirst.mockResolvedValue({ id: 300 });
    tx.clubStudentT.findFirst.mockResolvedValue({ id: 400 });
    tx.clubT.findFirst.mockResolvedValue({ startTerm, endTerm });
    tx.clubDivisionHistory.findFirst.mockResolvedValue({ id: 500 });

    await service.patchExecutiveRegistrationsClubRegistrationApproval(100);

    expect(tx.clubDelegateD.updateMany).toHaveBeenCalledWith({
      where: {
        clubId,
        startTerm: { lte: approvedAt },
        OR: [{ endTerm: { gte: approvedAt } }, { endTerm: null }],
        deletedAt: null,
      },
      data: { endTerm: approvedAt },
    });
    expect(tx.clubDelegateD.create).toHaveBeenCalledWith({
      data: {
        clubId,
        studentId: applicantId,
        clubDelegateEnum: ClubDelegateEnum.Representative,
        startTerm: approvedAt,
      },
    });
    expect(
      tx.clubDelegateD.updateMany.mock.invocationCallOrder[0],
    ).toBeLessThan(tx.clubDelegateD.create.mock.invocationCallOrder[0]);
    expect(tx.clubStudentT.create).not.toHaveBeenCalled();
    expect(tx.clubT.create).not.toHaveBeenCalled();
    expect(tx.clubDivisionHistory.create).not.toHaveBeenCalled();
    expect(tx.registrationApplicationStudent.create).not.toHaveBeenCalled();
    expect(tx.registrationApplicationStudent.updateMany).toHaveBeenCalledWith({
      where: {
        studentId: applicantId,
        clubId,
        semesterId,
        deletedAt: null,
        registrationApplicationStudentEnum: {
          not: RegistrationApplicationStudentStatusEnum.Approved,
        },
      },
      data: {
        registrationApplicationStudentEnum:
          RegistrationApplicationStudentStatusEnum.Approved,
      },
    });
  });

  it("rejects an applicant who now holds a role in another club", async () => {
    const { service, tx } = setup();
    tx.clubDelegateD.findFirst.mockResolvedValueOnce({ clubId: 43 });
    await expect(
      service.patchExecutiveRegistrationsClubRegistrationApproval(100),
    ).rejects.toThrow("Registration applicant is a delegate of another club");
    expect(tx.clubDelegateD.updateMany).not.toHaveBeenCalled();
    expect(tx.clubStudentT.create).not.toHaveBeenCalled();
    expect(tx.registrationApplicationStudent.create).not.toHaveBeenCalled();
  });

  it("rejects a deleted applicant before creating club data", async () => {
    const { service, tx, getStudentsByIds } = setup();
    getStudentsByIds.mockResolvedValue([]);
    await expect(
      service.patchExecutiveRegistrationsClubRegistrationApproval(100),
    ).rejects.toThrow("Registration applicant does not exist");
    expect(tx.clubT.create).not.toHaveBeenCalled();
  });

  it("does not approve outside the registration period", async () => {
    const { service, tx, checkDeadline } = setup();
    checkDeadline.mockRejectedValue(new Error("Deadline closed"));
    await expect(
      service.patchExecutiveRegistrationsClubRegistrationApproval(100),
    ).rejects.toThrow("Deadline closed");
    expect(tx.registration.updateMany).not.toHaveBeenCalled();
  });

  it("does not repeat an already completed approval", async () => {
    const { service, tx } = setup();
    tx.registration.updateMany.mockResolvedValue({ count: 0 });
    await expect(
      service.patchExecutiveRegistrationsClubRegistrationApproval(100),
    ).rejects.toThrow("Registration not found");
    expect(tx.clubT.create).not.toHaveBeenCalled();
    expect(tx.clubDelegateD.updateMany).not.toHaveBeenCalled();
    expect(tx.clubDelegateD.create).not.toHaveBeenCalled();
  });
});
