import { Prisma } from "@prisma/client";

import { PrismaService } from "@sparcs-clubs/api/prisma/prisma.service";

import { UserLoginIdentityRepository } from "./user-login-identity.repository";

const mockDelegate = () => ({
  // PrismaService identifies a delegate using these two standard operations.
  findMany: jest.fn().mockResolvedValue([]),
  create: jest.fn(),
  upsert: jest
    .fn()
    .mockImplementation(async ({ create }) => ({ id: 1, ...create })),
  update: jest
    .fn()
    .mockImplementation(async ({ data }) => ({ id: 1, ...data })),
});
const mockRawClient = {
  studentT: mockDelegate(),
  professorT: mockDelegate(),
  employeeT: mockDelegate(),
  executive: mockDelegate(),
};

jest.mock("@sparcs-clubs/api/env", () => ({ env: { NODE_ENV: "test" } }));
jest.mock("@prisma/client", () => ({
  ...jest.requireActual("@prisma/client"),
  PrismaClient: class {
    constructor() {
      Object.assign(this, mockRawClient);
    }

    async $transaction(operation: (client: unknown) => Promise<unknown>) {
      return operation(this);
    }
  },
}));

describe("SSO ORM dates through PrismaService's real transaction proxy", () => {
  const startTerm = new Date("2026-02-28T15:00:00.000Z");
  const endTerm = new Date("2026-08-31T14:59:59.000Z");
  const storedStart = new Date("2026-03-01T00:00:00.000Z");
  const storedEnd = new Date("2026-08-31T23:59:59.000Z");

  beforeEach(() => jest.clearAllMocks());

  it("stores student, professor, and employee term dates in KST and returns UTC Dates", async () => {
    const prisma = new PrismaService();
    await prisma.$transaction(async transaction => {
      const repository = new UserLoginIdentityRepository({
        tx: transaction,
      } as never);
      const student = await repository.ensureStudentTerm({
        studentId: 11,
        semesterId: 19,
        startTerm,
        endTerm,
        studentEnum: 2,
        studentStatusEnum: 1,
        department: null,
      });
      const professor = await repository.ensureProfessorTerm({
        professorId: 13,
        department: null,
        startTerm,
      });
      const employee = await repository.ensureEmployeeTerm({
        employeeId: 17,
        startTerm,
      });
      expect(student.startTerm).toEqual(startTerm);
      expect(student.endTerm).toEqual(endTerm);
      expect(professor.startTerm).toEqual(startTerm);
      expect(employee.startTerm).toEqual(startTerm);
    });

    expect(mockRawClient.studentT.upsert.mock.calls[0][0].create).toMatchObject(
      { startTerm: storedStart, endTerm: storedEnd },
    );
    expect(mockRawClient.professorT.upsert.mock.calls[0][0]).toMatchObject({
      create: { startTerm: storedStart },
      update: { startTerm: storedStart },
    });
    expect(mockRawClient.employeeT.upsert.mock.calls[0][0]).toMatchObject({
      create: { startTerm: storedStart },
      update: { startTerm: storedStart },
    });
    expect(startTerm.toISOString()).toBe("2026-02-28T15:00:00.000Z");
  });

  it("preserves UTC inputs and the original collision error for a new transaction", async () => {
    const error = new Prisma.PrismaClientKnownRequestError("unique race", {
      code: "P2002",
      clientVersion: "test",
    });
    mockRawClient.professorT.upsert.mockRejectedValueOnce(error);
    const prisma = new PrismaService();
    await expect(
      prisma.$transaction(async transaction => {
        const repository = new UserLoginIdentityRepository({
          tx: transaction,
        } as never);
        await repository.ensureProfessorTerm({
          professorId: 13,
          department: null,
          startTerm,
        });
      }),
    ).rejects.toBe(error);

    expect(
      mockRawClient.professorT.upsert.mock.calls[0][0].update.startTerm,
    ).toEqual(storedStart);
    expect(mockRawClient.professorT.update).not.toHaveBeenCalled();
    expect(startTerm.toISOString()).toBe("2026-02-28T15:00:00.000Z");
  });

  it("uses the same KST-shifted instant at both inclusive executive term boundaries", async () => {
    const queriedAt = new Date("2026-09-15T10:00:00.000Z");
    const prisma = new PrismaService();
    await prisma.$transaction(async transaction => {
      const repository = new UserLoginIdentityRepository({
        tx: transaction,
      } as never);
      await repository.findActiveExecutives(11, queriedAt);
    });
    const conditions =
      mockRawClient.executive.findMany.mock.calls[0][0].where.executiveTs.some;
    expect(conditions.startTerm.lte).toEqual(
      new Date("2026-09-15T19:00:00.000Z"),
    );
    expect(conditions.OR).toEqual([
      { endTerm: null },
      { endTerm: { gte: conditions.startTerm.lte } },
    ]);
    expect(queriedAt.toISOString()).toBe("2026-09-15T10:00:00.000Z");
  });
});
