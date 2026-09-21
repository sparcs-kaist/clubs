import { ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import { JwtAccessGuard } from "@sparcs-clubs/api/feature/auth/guard/jwt-access.guard";

import { Roles, Student } from "./method-decorator";

class StudentRoutes {
  @Student()
  student() {}

  @Roles("undergraduate")
  undergraduate() {}
}

describe("student role permissions", () => {
  const guard = new JwtAccessGuard(new Reflector());
  const context = (route: "student" | "undergraduate") =>
    ({
      getHandler: () => StudentRoutes.prototype[route],
      getClass: () => StudentRoutes,
    }) as unknown as ExecutionContext;

  it.each([
    "undergraduate",
    "master",
    "doctor",
    "masterDoctorDoctor",
    "masterDoctorMaster",
    "allPrograms",
    "auditor",
    "exchangeStudent",
  ])("allows %s to access student routes", type => {
    const user = { type, studentId: 1 };
    expect(guard.handleRequest(null, user, null, context("student"))).toBe(
      user,
    );
  });

  it.each([
    "master",
    "doctor",
    "masterDoctorDoctor",
    "masterDoctorMaster",
    "allPrograms",
    "auditor",
    "exchangeStudent",
  ])("does not grant undergraduate access to %s", type => {
    expect(() =>
      guard.handleRequest(null, { type }, null, context("undergraduate")),
    ).toThrow(UnauthorizedException);
  });

  it.each(["executive", "professor", "employee", "unknown"])(
    "does not grant student access to %s",
    type => {
      expect(() =>
        guard.handleRequest(null, { type }, null, context("student")),
      ).toThrow(UnauthorizedException);
    },
  );
});
