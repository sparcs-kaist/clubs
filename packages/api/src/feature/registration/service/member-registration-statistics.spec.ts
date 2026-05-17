import { getMemberRegistrationStatistics } from "./member-registration-statistics";

describe("getMemberRegistrationStatistics", () => {
  it("calculates statistics from the whole registration list", () => {
    const registrations = [
      {
        registrationApplicationStudentEnum: 1,
        student: { id: 101 },
      },
      {
        registrationApplicationStudentEnum: 2,
        student: { id: 102 },
      },
      {
        registrationApplicationStudentEnum: 3,
        student: { id: 103 },
      },
    ];
    const studentEnumByStudentId = new Map([
      [101, 1],
      [102, 1],
      [103, 2],
    ]);

    expect(
      getMemberRegistrationStatistics({
        registrations,
        studentEnumByStudentId,
        statusEnumIds: {
          pending: 1,
          approved: 2,
          rejected: 3,
          regularStudent: 1,
        },
      }),
    ).toEqual({
      totalRegistrations: 3,
      totalWaitings: 1,
      totalApprovals: 1,
      totalRejections: 1,
      regularMemberRegistrations: 2,
      regularMemberWaitings: 1,
      regularMemberApprovals: 1,
      regularMemberRejections: 0,
    });
  });
});
