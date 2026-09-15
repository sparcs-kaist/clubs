import {
  isEmployeeIdentity,
  isProfessorIdentity,
  isStudentIdentity,
  parseIdentityDepartment,
} from "./login-identity-policy";

describe("login identity role policy", () => {
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
