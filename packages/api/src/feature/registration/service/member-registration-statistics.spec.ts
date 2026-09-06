import {
  getMemberRegistrationStatistics,
  isUndergraduateMemberRegistration,
} from "./member-registration-statistics";

describe("isUndergraduateMemberRegistration", () => {
  it.each([
    [1, "20250001", true],
    [1, "20255999", true],
    [1, "20256000", false],
    [1, "20256999", false],
    [2, "20250001", false],
    [3, "20250001", false],
    [undefined, "20250001", false],
    [1, undefined, false],
  ])("classifies degree %s and number %s as %s", (degree, number, expected) => {
    expect(isUndergraduateMemberRegistration(degree, number)).toBe(expected);
  });
});

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
    const studentById = new Map(
      [101, 102, 103].map(id => [id, { studentNumber: `20250${id}` }]),
    );

    expect(
      getMemberRegistrationStatistics({
        registrations,
        studentEnumByStudentId,
        studentById,
        statusEnumIds: {
          pending: 1,
          approved: 2,
          rejected: 3,
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

  it("excludes exchange students and missing degrees from every status count", () => {
    const students = [
      { id: 1, studentEnumId: 1, studentNumber: "20250001" },
      { id: 2, studentEnumId: 1, studentNumber: "20256000" },
      { id: 3, studentEnumId: 2, studentNumber: "20252000" },
      { id: 4, studentEnumId: 3, studentNumber: "20255000" },
      { id: 5, studentEnumId: undefined, studentNumber: "20250005" },
    ];
    const registrations = students.flatMap(student =>
      [1, 2, 3].map(registrationApplicationStudentEnum => ({
        student: { id: student.id },
        registrationApplicationStudentEnum,
      })),
    );

    expect(
      getMemberRegistrationStatistics({
        registrations,
        studentEnumByStudentId: new Map(
          students.map(student => [student.id, student.studentEnumId]),
        ),
        studentById: new Map(students.map(student => [student.id, student])),
        statusEnumIds: { pending: 1, approved: 2, rejected: 3 },
      }),
    ).toEqual({
      totalRegistrations: 15,
      totalWaitings: 5,
      totalApprovals: 5,
      totalRejections: 5,
      regularMemberRegistrations: 3,
      regularMemberWaitings: 1,
      regularMemberApprovals: 1,
      regularMemberRejections: 1,
    });
  });
});
