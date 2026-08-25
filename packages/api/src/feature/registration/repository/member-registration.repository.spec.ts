import { RegistrationApplicationStudentStatusEnum } from "@clubs/interface/common/enum/registration.enum";

import { MemberRegistrationRepository } from "./member-registration.repository";

const studentId = 301;
const clubId = 201;
const semesterId = 7;

describe("MemberRegistrationRepository commands", () => {
  it("creates and rejects pending registrations", async () => {
    const registrationApplicationStudent = {
      create: jest.fn().mockResolvedValue({ id: 1 }),
      updateMany: jest.fn().mockResolvedValue({ count: 2 }),
    };
    const repository = new MemberRegistrationRepository({
      tx: { registrationApplicationStudent },
    } as never);

    await repository.createPending(studentId, clubId, semesterId);
    await repository.rejectPending(clubId, semesterId);

    expect(registrationApplicationStudent.create).toHaveBeenCalledWith({
      data: {
        studentId,
        clubId,
        semesterId,
        registrationApplicationStudentEnum:
          RegistrationApplicationStudentStatusEnum.Pending,
      },
    });
    expect(registrationApplicationStudent.updateMany).toHaveBeenCalledWith({
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
});
