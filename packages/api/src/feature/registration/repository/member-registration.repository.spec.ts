import { RegistrationApplicationStudentStatusEnum } from "@clubs/interface/common/enum/registration.enum";

import { MemberRegistrationRepository } from "./member-registration.repository";

describe("MemberRegistrationRepository initializeApprovedApplicant", () => {
  const applicant = { clubId: 42, semesterId: 20, studentId: 17160 };

  const resetOtherApprovals = {
    where: {
      clubId: applicant.clubId,
      semesterId: applicant.semesterId,
      studentId: { not: applicant.studentId },
      deletedAt: null,
      registrationApplicationStudentEnum:
        RegistrationApplicationStudentStatusEnum.Approved,
    },
    data: {
      registrationApplicationStudentEnum:
        RegistrationApplicationStudentStatusEnum.Pending,
    },
  };

  it("creates the applicant's approved application and resets only other approved applications for that club and semester", async () => {
    const delegate = {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
      updateMany: jest.fn(),
    };
    const repository = new MemberRegistrationRepository({
      tx: { registrationApplicationStudent: delegate },
    } as never);

    await repository.initializeApprovedApplicant(applicant);

    expect(delegate.findFirst).toHaveBeenCalledWith({
      where: { ...applicant, deletedAt: null },
      select: { id: true },
    });
    expect(delegate.create).toHaveBeenCalledWith({
      data: {
        ...applicant,
        registrationApplicationStudentEnum:
          RegistrationApplicationStudentStatusEnum.Approved,
      },
    });
    expect(delegate.updateMany).toHaveBeenCalledTimes(1);
    expect(delegate.updateMany).toHaveBeenCalledWith(resetOtherApprovals);
  });

  it("approves existing applicant applications without duplicating them", async () => {
    const delegate = {
      findFirst: jest.fn().mockResolvedValue({ id: 77 }),
      create: jest.fn(),
      updateMany: jest.fn(),
    };
    const repository = new MemberRegistrationRepository({
      tx: { registrationApplicationStudent: delegate },
    } as never);

    await repository.initializeApprovedApplicant(applicant);

    expect(delegate.create).not.toHaveBeenCalled();
    expect(delegate.updateMany).toHaveBeenCalledTimes(2);
    expect(delegate.updateMany).toHaveBeenNthCalledWith(1, resetOtherApprovals);
    expect(delegate.updateMany).toHaveBeenNthCalledWith(2, {
      where: {
        ...applicant,
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
});
