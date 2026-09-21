import {
  isEmployeeIdentity,
  isHpStudentNumber,
  isProfessorIdentity,
  isStudentIdentity,
  parseIdentityDepartment,
} from "./login-identity-policy";

describe("login identity role policy", () => {
  it.each([
    [20996899, false],
    [20996900, true],
    [20996999, true],
    [20997000, false],
    ["20996899", false],
    ["20996900", true],
    ["20996999", true],
    ["20997000", false],
    ["not-a-number", false],
  ] as const)("identifies HP student number %s", (studentNumber, expected) => {
    expect(isHpStudentNumber(studentNumber)).toBe(expected);
  });

  it.each([
    ["", "", false],
    ["", "S", true],
    ["Student", "", true],
    ["Ex-employee", "", true],
    ["Student", "P", false],
    ["Ex-employee", "PA", false],
  ])("student role: %s / %s", (type, typeV2, expected) => {
    expect(isStudentIdentity(type as string, typeV2 as string)).toBe(expected);
  });

  it.each([
    ["", "", false],
    ["", "F", true],
    ["Teacher Associate", "", true],
    ["", "PA", true],
    ["", "P", true],
  ])("professor role: %s / %s", (type, typeV2, expected) => {
    expect(isProfessorIdentity(type as string, typeV2 as string)).toBe(
      expected,
    );
  });

  it.each([
    ["", "", false],
    ["", "E", true],
    ["", "R", true],
    ["Employee", "", true],
  ])("employee role: %s / %s", (type, typeV2, expected) => {
    expect(isEmployeeIdentity(type as string, typeV2 as string)).toBe(expected);
  });

  it.each([
    ["", null],
    ["abc", null],
    ["0", 0],
    ["1234department", 1234],
  ])("keeps the legacy department parsing of %s", (input, expected) => {
    expect(parseIdentityDepartment(input as string)).toBe(expected);
  });
});
