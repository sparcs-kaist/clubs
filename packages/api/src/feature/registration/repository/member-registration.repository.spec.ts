import { RegistrationApplicationStudentStatusEnum } from "@clubs/interface/common/enum/registration.enum";

import { MemberRegistrationRepository } from "./member-registration.repository";

describe("MemberRegistrationRepository ensureApprovedForStudent", () => {
  const applicant = { clubId: 42, semesterId: 20, studentId: 17160 };

  it("creates only the applicant's approved application when missing", async () => {
    const delegate = {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
      updateMany: jest.fn(),
    };
    const repository = new MemberRegistrationRepository({
      tx: { registrationApplicationStudent: delegate },
    } as never);

    await repository.ensureApprovedForStudent(applicant);

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
    expect(delegate.updateMany).not.toHaveBeenCalled();
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

    await repository.ensureApprovedForStudent(applicant);

    expect(delegate.create).not.toHaveBeenCalled();
    expect(delegate.updateMany).toHaveBeenCalledWith({
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
