import { HttpException, NotFoundException } from "@nestjs/common";

import { ApiReg001RequestBody } from "@clubs/interface/api/registration/endpoint/apiReg001";
import { RegistrationErrorCode } from "@clubs/interface/api/registration/type/registration-error";
import { ClubTypeEnum } from "@clubs/interface/common/enum/club.enum";
import { RegistrationTypeEnum } from "@clubs/interface/common/enum/registration.enum";

import { RegistrationService } from "./registration.service";

jest.mock("@nestjs-cls/transactional", () => ({
  Transactional: () => () => undefined,
}));

type Dependencies = ConstructorParameters<typeof RegistrationService>;
const body: ApiReg001RequestBody = {
  clubId: 123,
  registrationTypeEnumId: RegistrationTypeEnum.ReProvisional,
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

const createContext = (
  history: Partial<Record<number, ClubTypeEnum>> = {
    9: ClubTypeEnum.Provisional,
  },
) => {
  const repository = {
    findByClubAndSemesterId: jest.fn().mockResolvedValue([]),
    findByStudentAndSemesterId: jest.fn().mockResolvedValue([]),
    createRegistration: jest.fn().mockResolvedValue({ id: 456 }),
    putStudentRegistrationsClubRegistration: jest.fn().mockResolvedValue({}),
  };
  const clubs = {
    findStudentClubDelegate: jest.fn().mockResolvedValue({ id: 123 }),
    getClubByClubId: jest.fn().mockResolvedValue([{ id: 123 }]),
    makeClubSummaryResponse: jest.fn().mockResolvedValue({ id: 123 }),
    getClubsExistedSemesters: jest
      .fn()
      .mockResolvedValue(Object.keys(history).map(id => ({ id: Number(id) }))),
    getClubSummariesByClubIdAndSemesterIds: jest
      .fn()
      .mockImplementation(async (_clubId, ids: number[]) =>
        ids.map(id => ({ id: 123, typeEnum: history[id] })),
      ),
  };
  const division = { findDivisionById: jest.fn().mockResolvedValue({ id: 1 }) };
  const files = {
    getFileInfoById: jest.fn().mockResolvedValue({ id: "plan-file" }),
  };
  const registration = {
    checkDeadline: jest.fn().mockResolvedValue(undefined),
  };
  const semester = {
    loadId: jest.fn().mockResolvedValue(10),
    load: jest.fn().mockResolvedValue({ id: 10 }),
  };
  const service = new RegistrationService(
    repository as unknown as Dependencies[0],
    clubs as unknown as Dependencies[1],
    division as unknown as Dependencies[2],
    files as unknown as Dependencies[3],
    registration as unknown as Dependencies[4],
    {} as Dependencies[5],
    {} as Dependencies[6],
    semester as unknown as Dependencies[7],
    {} as Dependencies[8],
    {} as Dependencies[9],
  );
  return { service, repository, clubs, files, registration };
};

const expectCode = async (
  operation: Promise<unknown>,
  code: RegistrationErrorCode,
) => {
  await expect(operation).rejects.toMatchObject({ response: { code } });
};

describe("club application eligibility", () => {
  it.each([
    ClubTypeEnum.Regular,
    ClubTypeEnum.Provisional,
    ClubTypeEnum.RegistrationCanceled,
    ClubTypeEnum.Special,
    ClubTypeEnum.Unregistered,
  ])(
    "preserves provisional renewal from previous-semester club status %s",
    async type => {
      const { service, repository } = createContext({ 9: type });
      await expect(
        service.postStudentRegistrationClubRegistration(200, body),
      ).resolves.toEqual({ id: 456 });
      expect(repository.createRegistration).toHaveBeenCalledWith(
        200,
        10,
        expect.objectContaining({
          registrationTypeEnumId: RegistrationTypeEnum.ReProvisional,
          clubId: 123,
        }),
      );
    },
  );

  it("rejects provisional renewal with only an older-semester record", async () => {
    const { service, repository } = createContext({
      8: ClubTypeEnum.Provisional,
    });
    await expectCode(
      service.postStudentRegistrationClubRegistration(200, body),
      RegistrationErrorCode.NotEligible,
    );
    expect(repository.createRegistration).not.toHaveBeenCalled();
  });

  it.each([
    [{ 9: ClubTypeEnum.Provisional }, [RegistrationTypeEnum.ReProvisional]],
    [
      { 9: ClubTypeEnum.Regular },
      [RegistrationTypeEnum.Renewal, RegistrationTypeEnum.ReProvisional],
    ],
    [
      { 9: ClubTypeEnum.Regular, 8: ClubTypeEnum.Regular },
      [
        RegistrationTypeEnum.Renewal,
        RegistrationTypeEnum.Promotional,
        RegistrationTypeEnum.ReProvisional,
      ],
    ],
    [
      { 9: ClubTypeEnum.Provisional, 8: ClubTypeEnum.Provisional },
      [RegistrationTypeEnum.Promotional, RegistrationTypeEnum.ReProvisional],
    ],
    [
      { 9: ClubTypeEnum.Provisional, 7: ClubTypeEnum.Provisional },
      [RegistrationTypeEnum.ReProvisional],
    ],
    [{ 8: ClubTypeEnum.Regular }, [RegistrationTypeEnum.Promotional]],
    [{ 7: ClubTypeEnum.Regular }, [RegistrationTypeEnum.Promotional]],
    [{ 6: ClubTypeEnum.Regular }, []],
    [{}, []],
  ])(
    "preserves available registration types for history %o",
    async (history, expected) => {
      const { service } = createContext(
        history as Partial<Record<number, ClubTypeEnum>>,
      );
      const result = await service.getStudentRegistrationsAvailableClub(200);
      expect(result.club?.availableRegistrationTypeEnums).toEqual(expected);
    },
  );
});

describe("club application errors", () => {
  it.each([
    ["findByClubAndSemesterId", RegistrationErrorCode.ClubAlreadyApplied],
    ["findByStudentAndSemesterId", RegistrationErrorCode.StudentAlreadyApplied],
  ] as const)(
    "distinguishes duplicates detected by %s",
    async (method, code) => {
      const { service, repository } = createContext();
      repository[method].mockResolvedValue([{ id: 789 }]);
      await expectCode(
        service.postStudentRegistrationClubRegistration(200, body),
        code,
      );
      expect(repository.createRegistration).not.toHaveBeenCalled();
    },
  );

  it("preserves a closed-period failure before checking duplicates", async () => {
    const { service, repository, registration } = createContext();
    registration.checkDeadline.mockRejectedValue(
      new HttpException(
        { code: RegistrationErrorCode.RegistrationPeriodClosed },
        400,
      ),
    );
    await expectCode(
      service.postStudentRegistrationClubRegistration(200, body),
      RegistrationErrorCode.RegistrationPeriodClosed,
    );
    expect(repository.findByStudentAndSemesterId).not.toHaveBeenCalled();
  });

  it.each(["create", "update"])(
    "identifies a missing uploaded file on %s",
    async mode => {
      const { service, files } = createContext();
      files.getFileInfoById.mockRejectedValue(new NotFoundException());
      const operation =
        mode === "create"
          ? service.postStudentRegistrationClubRegistration(200, body)
          : service.putStudentRegistrationsClubRegistration(200, 456, body);
      await expectCode(operation, RegistrationErrorCode.InvalidAttachment);
    },
  );

  it("does not mislabel an infrastructure error as an invalid attachment", async () => {
    const { service, files } = createContext();
    const error = new Error("file service unavailable");
    files.getFileInfoById.mockRejectedValue(error);
    await expect(
      service.postStudentRegistrationClubRegistration(200, body),
    ).rejects.toBe(error);
  });
});
