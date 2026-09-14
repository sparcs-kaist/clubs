import { ApiReg001RequestBody } from "@clubs/interface/api/registration/endpoint/apiReg001";
import { RegistrationErrorCode } from "@clubs/interface/api/registration/type/registration-error";
import {
  RegistrationStatusEnum,
  RegistrationTypeEnum,
} from "@clubs/interface/common/enum/registration.enum";

import { ClubRegistrationRepository } from "./club-registration.repository";

type Dependencies = ConstructorParameters<typeof ClubRegistrationRepository>;
const body: ApiReg001RequestBody = {
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

const createContext = () => {
  const transaction = {
    $queryRaw: jest.fn(),
    clubDelegateD: {
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({ id: 1 }),
    },
    registration: {
      create: jest.fn().mockResolvedValue({ id: 456 }),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
  };
  const prisma = {
    $transaction: jest.fn(async callback => callback(transaction)),
  };
  const repository = new ClubRegistrationRepository(
    prisma as unknown as Dependencies[0],
    { tx: transaction } as unknown as Dependencies[1],
  );
  Object.assign(repository, {
    clock: { now: () => new Date("2026-09-01T00:00:00Z") },
  });
  return { repository, transaction };
};

describe("club application repository guards", () => {
  it("rejects a current representative's new provisional application before inserting a club", async () => {
    const { repository, transaction } = createContext();
    transaction.clubDelegateD.findMany.mockResolvedValue([{ id: 1 }]);
    await expect(
      repository.createRegistration(200, 10, body),
    ).rejects.toMatchObject({
      response: { code: RegistrationErrorCode.AlreadyClubDelegate },
    });
    expect(transaction.$queryRaw).not.toHaveBeenCalled();
    expect(transaction.registration.create).not.toHaveBeenCalled();
  });

  it("rejects existing-club applications from a non-delegate", async () => {
    const { repository, transaction } = createContext();
    transaction.$queryRaw.mockResolvedValue([]);
    await expect(
      repository.createRegistration(200, 10, {
        ...body,
        clubId: 123,
        registrationTypeEnumId: RegistrationTypeEnum.ReProvisional,
      }),
    ).rejects.toMatchObject({
      response: { code: RegistrationErrorCode.NotClubDelegate },
    });
    expect(transaction.registration.create).not.toHaveBeenCalled();
  });

  it("creates a new provisional application without an advisor", async () => {
    const { repository, transaction } = createContext();
    transaction.$queryRaw
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: BigInt(123) }]);
    await expect(repository.createRegistration(200, 10, body)).resolves.toEqual(
      { id: 456 },
    );
    expect(transaction.registration.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ clubId: 123, professorId: null }),
    });
  });

  it("keeps the persisted club, application type, and owner in the edit lookup", async () => {
    const { repository, transaction } = createContext();
    transaction.$queryRaw.mockResolvedValue([
      { RegistrationStatusEnum: RegistrationStatusEnum.Pending },
    ]);
    await expect(
      repository.putStudentRegistrationsClubRegistration(200, 456, {
        ...body,
        clubId: 123,
      }),
    ).resolves.toEqual({});
    const query = transaction.$queryRaw.mock.calls[0][0];
    expect(query.values).toEqual([
      456,
      123,
      RegistrationTypeEnum.NewProvisional,
      200,
    ]);
    expect(transaction.registration.updateMany).toHaveBeenCalledWith({
      where: { id: 456, studentId: 200, deletedAt: null },
      data: expect.objectContaining({ professorId: null }),
    });
  });

  it.each([
    { rows: [] },
    { rows: [{ RegistrationStatusEnum: RegistrationStatusEnum.Approved }] },
  ])(
    "does not edit a missing, mismatched, or approved application: %o",
    async ({ rows }) => {
      const { repository, transaction } = createContext();
      transaction.$queryRaw.mockResolvedValue(rows);
      await expect(
        repository.putStudentRegistrationsClubRegistration(200, 456, {
          ...body,
          clubId: 123,
        }),
      ).rejects.toMatchObject({
        response: { code: RegistrationErrorCode.ApplicationNotEditable },
      });
      expect(transaction.registration.updateMany).not.toHaveBeenCalled();
    },
  );
});
