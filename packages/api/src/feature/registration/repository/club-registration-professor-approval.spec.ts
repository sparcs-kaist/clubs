import { HttpStatus } from "@nestjs/common";

import { ProfessorApprovalStatus } from "@clubs/domain/activity/activity";

import { RegistrationStatusEnum } from "@clubs/interface/common/enum/registration.enum";

import { ClubRegistrationRepository } from "./club-registration.repository";

const approval = {
  registrationId: 10,
  professorId: 20,
  approvedAt: new Date("2026-09-20T12:00:00.000Z"),
  approvalStatus: ProfessorApprovalStatus.LateApproved,
};

function createRepository(count = 1) {
  type Dependencies = ConstructorParameters<typeof ClubRegistrationRepository>;
  const tx = {
    registration: { updateMany: jest.fn().mockResolvedValue({ count }) },
    registrationProfessorApprovalLog: { create: jest.fn() },
  };
  const repository = new ClubRegistrationRepository(
    {} as Dependencies[0],
    { tx } as unknown as Dependencies[1],
    {} as Dependencies[2],
  );
  return { repository, tx };
}

describe("Club registration professor approval persistence", () => {
  it("writes the signature and logs its state only after the guarded update succeeds", async () => {
    const { repository, tx } = createRepository();
    await repository.recordProfessorApproval(approval);
    expect(tx.registration.updateMany).toHaveBeenCalledWith({
      where: {
        id: approval.registrationId,
        professorId: approval.professorId,
        professorApprovedAt: null,
        deletedAt: null,
      },
      data: {
        professorApprovedAt: approval.approvedAt,
        professorApprovalStatus: approval.approvalStatus,
      },
    });
    expect(tx.registrationProfessorApprovalLog.create).toHaveBeenCalledWith({
      data: approval,
    });
    expect(tx.registration.updateMany.mock.invocationCallOrder[0]).toBeLessThan(
      tx.registrationProfessorApprovalLog.create.mock.invocationCallOrder[0],
    );
  });

  it("does not create a log if a repeated or stale request changed no row", async () => {
    const { repository, tx } = createRepository(0);
    await expect(
      repository.recordProfessorApproval(approval),
    ).rejects.toMatchObject({
      status: HttpStatus.CONFLICT,
    });
    expect(tx.registrationProfessorApprovalLog.create).not.toHaveBeenCalled();
  });

  it("resets only the same club and semester, leaving the approval log available", async () => {
    const { repository, tx } = createRepository();
    await repository.resetClubRegistrationStatusEnum(3, 4);
    expect(tx.registration.updateMany).toHaveBeenCalledWith({
      where: { clubId: 3, semesterId: 4, deletedAt: null },
      data: {
        registrationApplicationStatusEnumId: RegistrationStatusEnum.Pending,
        professorApprovalStatus: ProfessorApprovalStatus.Pending,
        professorApprovedAt: null,
      },
    });
    expect(tx.registrationProfessorApprovalLog.create).not.toHaveBeenCalled();
  });
});
