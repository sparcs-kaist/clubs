import { HttpException } from "@nestjs/common";
import { ZodError } from "zod";

import apiReg001 from "@clubs/interface/api/registration/endpoint/apiReg001";
import apiReg009 from "@clubs/interface/api/registration/endpoint/apiReg009";
import { RegistrationErrorCode } from "@clubs/interface/api/registration/type/registration-error";
import { RegistrationTypeEnum } from "@clubs/interface/common/enum/registration.enum";

import { RegistrationRequestPipe } from "./registration-request.pipe";

const body = {
  registrationTypeEnumId: RegistrationTypeEnum.NewProvisional,
  clubNameKr: "테스트 동아리",
  clubNameEn: "Test Club",
  phoneNumber: "010-1234-5678",
  foundedAt: new Date("2026-01-01T00:00:00Z"),
  divisionId: 1,
  activityFieldKr: "테스트",
  activityFieldEn: "Test",
  divisionConsistency: "테스트",
  foundationPurpose: "테스트",
  activityPlan: "테스트",
  activityPlanFileId: "plan-file",
};

const createPipe = new RegistrationRequestPipe(apiReg001);
const updatePipe = new RegistrationRequestPipe(apiReg009);
const transform = (value: unknown, pipe = createPipe) =>
  pipe.transform(value, { type: "body" });

const getFailure = (value: unknown) => {
  try {
    transform(value);
  } catch (error) {
    return error;
  }
  throw new Error("Expected invalid registration input");
};

describe("club registration request validation", () => {
  it("accepts an optional advisor and normalizes null clubId on creation", () => {
    expect(transform({ ...body, clubId: null })).toMatchObject({
      clubId: undefined,
      registrationTypeEnumId: RegistrationTypeEnum.NewProvisional,
    });
  });

  it("accepts the persisted clubId when editing a new provisional application", () => {
    expect(transform({ ...body, clubId: 123 }, updatePipe)).toMatchObject({
      clubId: 123,
      registrationTypeEnumId: RegistrationTypeEnum.NewProvisional,
    });
  });

  it.each([
    [{ clubId: 123 }, RegistrationErrorCode.InvalidClub],
    [{ clubId: -1 }, RegistrationErrorCode.InvalidClub],
    [{ registrationTypeEnumId: 99 }, RegistrationErrorCode.InvalidRequest],
    [
      { registrationTypeEnumId: RegistrationTypeEnum.ReProvisional },
      RegistrationErrorCode.InvalidClub,
    ],
    [
      { activityPlanFileId: undefined },
      RegistrationErrorCode.MissingAttachment,
    ],
    [{ activityPlanFileId: "" }, RegistrationErrorCode.MissingAttachment],
    [
      { activityPlanFileId: "x".repeat(129) },
      RegistrationErrorCode.InvalidAttachment,
    ],
    [{ clubRuleFileId: "rules" }, RegistrationErrorCode.InvalidAttachment],
    [
      { registrationTypeEnumId: RegistrationTypeEnum.Promotional, clubId: 123 },
      RegistrationErrorCode.MissingAttachment,
    ],
  ])("returns a stable registration error for %o", (overrides, code) => {
    const error = getFailure({ ...body, ...overrides }) as HttpException;
    expect(error).toBeInstanceOf(HttpException);
    expect(error.getStatus()).toBe(400);
    expect(error.getResponse()).toMatchObject({ code });
  });

  it.each([
    [{ phoneNumber: "123" }, "phoneNumber"],
    [{ clubNameKr: "x".repeat(31) }, "clubNameKr"],
    [
      { professor: { name: "교수", email: "invalid", professorEnumId: 1 } },
      "professor",
    ],
  ])("preserves ordinary Zod field errors for %o", (overrides, field) => {
    const error = getFailure({ ...body, ...overrides }) as ZodError;
    expect(error).toBeInstanceOf(ZodError);
    expect(error.issues[0].path[0]).toBe(field);
  });
});
