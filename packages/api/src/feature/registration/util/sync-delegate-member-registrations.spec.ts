import { RegistrationApplicationStudentStatusEnum } from "@clubs/interface/common/enum/registration.enum";

import { syncDelegateMemberRegistrations } from "./sync-delegate-member-registrations";

describe("syncDelegateMemberRegistrations", () => {
  it("creates approved applications and memberships for delegates", async () => {
    const createApplications = jest.fn();
    const createMembers = jest.fn();
    const tx = {
      student: {
        findMany: jest.fn().mockResolvedValue([{ id: 1 }, { id: 2 }]),
      },
      registrationApplicationStudent: {
        findMany: jest.fn().mockResolvedValue([]),
        createMany: createApplications,
      },
      clubStudentT: {
        findMany: jest.fn().mockResolvedValue([]),
        createMany: createMembers,
      },
    };
    const startTerm = new Date("2026-03-01T00:00:00.000Z");
    const endTerm = new Date("2026-08-31T23:59:59.000Z");

    await syncDelegateMemberRegistrations({
      tx: tx as never,
      clubId: 1,
      semesterId: 19,
      startTerm,
      endTerm,
      studentIds: [1, 2, 1],
    });

    expect(createApplications).toHaveBeenCalledWith({
      data: [1, 2].map(studentId => ({
        studentId,
        clubId: 1,
        semesterId: 19,
        registrationApplicationStudentEnum:
          RegistrationApplicationStudentStatusEnum.Approved,
      })),
    });
    expect(createMembers).toHaveBeenCalledWith({
      data: [1, 2].map(studentId => ({
        studentId,
        clubId: 1,
        semesterId: 19,
        startTerm,
        endTerm,
      })),
    });
  });
});
