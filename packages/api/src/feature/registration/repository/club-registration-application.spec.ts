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
      findFirst: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
      findUniqueOrThrow: jest
        .fn()
        .mockResolvedValue({ phoneNumber: body.phoneNumber }),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
  };
  const prisma = {
    $transaction: jest.fn(async callback => callback(transaction)),
  };
  const professorRepository = {
    saveRegistrationAdvisor: jest.fn().mockResolvedValue(73),
  };
  const repository = new ClubRegistrationRepository(
    prisma as unknown as Dependencies[0],
    { tx: transaction } as unknown as Dependencies[1],
    professorRepository as unknown as Dependencies[2],
  );
  Object.assign(repository, {
    clock: { now: () => new Date("2026-09-01T00:00:00Z") },
  });
  return { repository, transaction, professorRepository };
};

describe("club application repository guards", () => {
  it("scopes the history list and detail to the same previous semester and applicant or delegate clubs", async () => {
    const { repository, transaction } = createContext();
    const scope = { semesterId: 8, delegateClubIds: [12, 34] };
    const where = {
      semesterId: 8,
      deletedAt: null,
      OR: [{ studentId: 200 }, { clubId: { in: [12, 34] } }],
    };

    await repository.getStudentPreviousClubRegistrations(200, scope);
    await expect(
      repository.hasPreviousClubRegistration(200, 456, scope),
    ).resolves.toBe(false);
    expect(transaction.registration.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where }),
    );
    expect(transaction.registration.findFirst).toHaveBeenCalledWith({
      where: { id: 456, ...where },
      select: { id: true },
    });
  });

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

  it("creates an application with an advisor identified by name and email", async () => {
    const { repository, transaction, professorRepository } = createContext();
    const professor = { name: "지도교수", email: "advisor@kaist.ac.kr" };
    transaction.$queryRaw
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: BigInt(123) }]);

    await repository.createRegistration(200, 10, { ...body, professor });

    expect(professorRepository.saveRegistrationAdvisor).toHaveBeenCalledWith(
      professor,
      new Date("2026-09-01T00:00:00Z"),
    );
    expect(transaction.registration.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ professorId: 73 }),
    });
  });

  it("keeps the persisted club, application type, and owner in the edit lookup", async () => {
    const { repository, transaction } = createContext();
    transaction.$queryRaw.mockResolvedValue([
      { RegistrationStatusEnum: RegistrationStatusEnum.Pending },
    ]);
    await expect(
      repository.putStudentRegistrationsClubRegistration(
        200,
        456,
        { ...body, clubId: 123 },
        10,
      ),
    ).resolves.toBeUndefined();
    const query = transaction.$queryRaw.mock.calls[0][0];
    expect(query.values).toEqual([
      456,
      123,
      RegistrationTypeEnum.NewProvisional,
      200,
    ]);
    expect(transaction.registration.updateMany).toHaveBeenCalledWith({
      where: { id: 456, studentId: 200, semesterId: 10, deletedAt: null },
      data: expect.objectContaining({ professorId: null }),
    });
  });

  it("does not read or change the stored number when the edit omits it", async () => {
    const { repository, transaction } = createContext();
    transaction.$queryRaw.mockResolvedValue([
      { RegistrationStatusEnum: RegistrationStatusEnum.Pending },
    ]);

    await expect(
      repository.putStudentRegistrationsClubRegistration(
        200,
        456,
        { ...body, clubId: 123, phoneNumber: undefined },
        10,
      ),
    ).resolves.toBeUndefined();
    expect(transaction.registration.findUniqueOrThrow).not.toHaveBeenCalled();
    expect(transaction.registration.updateMany).toHaveBeenCalledWith({
      where: { id: 456, studentId: 200, semesterId: 10, deletedAt: null },
      data: expect.objectContaining({ phoneNumber: undefined }),
    });
  });

  it("returns the requested number only after replacing a different snapshot", async () => {
    const { repository, transaction } = createContext();
    transaction.$queryRaw.mockResolvedValue([
      { RegistrationStatusEnum: RegistrationStatusEnum.Pending },
    ]);
    transaction.registration.findUniqueOrThrow.mockResolvedValue({
      phoneNumber: null,
    });

    await expect(
      repository.putStudentRegistrationsClubRegistration(
        200,
        456,
        { ...body, clubId: 123 },
        10,
      ),
    ).resolves.toBe(body.phoneNumber);
    expect(transaction.$queryRaw.mock.invocationCallOrder[0]).toBeLessThan(
      transaction.registration.findUniqueOrThrow.mock.invocationCallOrder[0],
    );
    expect(transaction.registration.updateMany).toHaveBeenCalledWith({
      where: { id: 456, studentId: 200, semesterId: 10, deletedAt: null },
      data: expect.objectContaining({ phoneNumber: body.phoneNumber }),
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
        repository.putStudentRegistrationsClubRegistration(
          200,
          456,
          { ...body, clubId: 123 },
          10,
        ),
      ).rejects.toMatchObject({
        response: { code: RegistrationErrorCode.ApplicationNotEditable },
      });
      expect(transaction.registration.updateMany).not.toHaveBeenCalled();
    },
  );
});
