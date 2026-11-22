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

  describe.each([
    ["creating", createPipe],
    ["editing", updatePipe],
  ] as const)("when %s a registration", (_, pipe) => {
    const fields = ["activityFieldKr", "activityFieldEn"] as const;

    it.each(fields)(
      "accepts 40 total and 30 non-whitespace characters in %s",
      field => {
        const value = `${"a".repeat(30)}${" ".repeat(10)}`;
        expect(transform({ ...body, [field]: value }, pipe)).toMatchObject({
          [field]: value,
        });
      },
    );

    it("counts a supplementary Unicode character as one code point", () => {
      const activityFieldKr = `${"가".repeat(29)}𠀀${" ".repeat(10)}`;
      expect(transform({ ...body, activityFieldKr }, pipe)).toMatchObject({
        activityFieldKr,
      });
    });

    it.each(fields)(
      "rejects either length overflow or blank input in %s",
      field => {
        const invalidValues = [
          "a".repeat(31),
          `${"a".repeat(30)}${" ".repeat(11)}`,
          "\t \u00a0",
        ];
        invalidValues.forEach(value => {
          expect(() => transform({ ...body, [field]: value }, pipe)).toThrow(
            ZodError,
          );
        });
      },
    );

    it("accepts an official English club name in the Korean name field", () => {
      const clubNameKr = "Test Club";
      expect(transform({ ...body, clubNameKr }, pipe)).toMatchObject({
        clubNameKr,
      });
    });

    it("accepts the advisor contact and ignores a legacy rank", () => {
      const professor = { name: "교수", email: "professor@kaist.ac.kr" };
      expect(transform({ ...body, professor }, pipe)).toMatchObject({
        professor,
      });
      const legacy = transform(
        { ...body, professor: { ...professor, professorEnumId: 1 } },
        pipe,
      );
      expect(legacy).toMatchObject({ professor });
      expect(legacy).not.toHaveProperty("professor.professorEnumId");
    });

    it("requires a KAIST email for a supplied advisor", () => {
      const professor = { name: "교수", email: "professor@example.com" };
      expect(() => transform({ ...body, professor }, pipe)).toThrow(ZodError);
    });
  });

  it("accepts the persisted clubId when editing a new provisional application", () => {
    expect(transform({ ...body, clubId: 123 }, updatePipe)).toMatchObject({
      clubId: 123,
      registrationTypeEnumId: RegistrationTypeEnum.NewProvisional,
    });
  });

  it("allows phoneNumber to be omitted only when editing", () => {
    const { phoneNumber, ...withoutPhone } = body;
    expect(() => transform(withoutPhone)).toThrow(ZodError);
    expect(
      transform({ ...withoutPhone, clubId: 123 }, updatePipe),
    ).not.toHaveProperty("phoneNumber");
    expect(
      transform({ ...withoutPhone, clubId: 123, phoneNumber }, updatePipe),
    ).toMatchObject({ phoneNumber });
    expect(() =>
      transform(
        { ...withoutPhone, clubId: 123, phoneNumber: "123" },
        updatePipe,
      ),
    ).toThrow(ZodError);
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
