import { Prisma } from "@prisma/client";

import { UserLoginIdentityRepository } from "./user-login-identity.repository";

const startTerm = new Date("2026-03-01T00:00:00.000Z");
const endTerm = new Date("2026-08-31T00:00:00.000Z");
const identity = { userId: 7, name: "Student", email: "same@example.com" };
const studentTerm = {
  studentId: 11,
  semesterId: 19,
  startTerm,
  endTerm,
  studentEnum: 2,
  studentStatusEnum: 1,
  department: null,
};

const createRepository = () => {
  const upsert = () => ({
    upsert: jest.fn().mockResolvedValue({ id: 1 }),
    update: jest.fn().mockResolvedValue({ id: 1 }),
  });
  const tx = {
    user: upsert(),
    student: upsert(),
    studentT: upsert(),
    professor: upsert(),
    professorT: upsert(),
    employee: { create: jest.fn().mockResolvedValue({ id: 1 }) },
    employeeT: upsert(),
    executive: {
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      findMany: jest.fn().mockResolvedValue([{ id: 2, studentId: 11 }]),
    },
  };
  return { tx, repository: new UserLoginIdentityRepository({ tx } as never) };
};

const upsertCases = [
  {
    delegate: "user",
    run: (r: UserLoginIdentityRepository) =>
      r.ensureUser({ sid: "sid", name: identity.name, email: identity.email }),
  },
  {
    delegate: "student",
    run: (r: UserLoginIdentityRepository) =>
      r.ensureStudent({ ...identity, number: 20262001 }),
  },
  {
    delegate: "studentT",
    run: (r: UserLoginIdentityRepository) => r.ensureStudentTerm(studentTerm),
  },
  {
    delegate: "professor",
    run: (r: UserLoginIdentityRepository) => r.ensureProfessor(identity),
  },
  {
    delegate: "professorT",
    run: (r: UserLoginIdentityRepository) =>
      r.ensureProfessorTerm({ professorId: 13, department: null, startTerm }),
  },
  {
    delegate: "employeeT",
    run: (r: UserLoginIdentityRepository) =>
      r.ensureEmployeeTerm({ employeeId: 17, startTerm }),
  },
] as const;

const prismaError = (code: string) =>
  new Prisma.PrismaClientKnownRequestError("database failure", {
    code,
    clientVersion: "test",
  });

describe("UserLoginIdentityRepository", () => {
  it("matches users by sid even when another user has the requested email, and preserves deleted rows", async () => {
    const { repository, tx } = createRepository();
    const deletedAt = new Date("2025-01-01T00:00:00.000Z");
    const rows = [
      {
        id: 1,
        sid: "existing",
        name: "old",
        email: "old@example.com",
        deletedAt,
      },
      {
        id: 2,
        sid: "other",
        name: "other",
        email: identity.email,
        deletedAt: null,
      },
    ];
    tx.user.upsert.mockImplementation(async ({ where, create, update }) => {
      const row = rows.find(candidate => candidate.sid === where.sid);
      if (row) return Object.assign(row, update);
      const created = { id: rows.length + 1, ...create, deletedAt: null };
      rows.push(created);
      return created;
    });

    const updated = await repository.ensureUser({
      sid: "existing",
      name: identity.name,
      email: identity.email,
    });
    const created = await repository.ensureUser({
      sid: "new",
      name: identity.name,
      email: identity.email,
    });

    expect(updated).toEqual({
      id: 1,
      sid: "existing",
      name: identity.name,
      email: identity.email,
      deletedAt,
    });
    expect(created.id).toBe(3);
    expect(rows[1]).toMatchObject({ id: 2, sid: "other", name: "other" });
    expect(tx.user.upsert.mock.calls[0][0].where).toEqual({ sid: "existing" });
    expect(tx.user.upsert.mock.calls[0][0].update).toEqual({
      name: identity.name,
      email: identity.email,
    });
  });

  it("updates a duplicate student term by the student/semester pair without replacing its id or validity interval", async () => {
    const { repository, tx } = createRepository();
    const oldStart = new Date("2025-03-01T00:00:00.000Z");
    const deletedAt = new Date("2025-07-01T00:00:00.000Z");
    const row = {
      ...studentTerm,
      id: 41,
      startTerm: oldStart,
      endTerm: null,
      deletedAt,
      studentEnum: 1,
    };
    tx.studentT.upsert.mockImplementation(async ({ update }) => ({
      ...row,
      ...update,
    }));

    const result = await repository.ensureStudentTerm(studentTerm);

    expect(tx.studentT.upsert).toHaveBeenCalledWith({
      where: { studentId_semesterId: { studentId: 11, semesterId: 19 } },
      create: studentTerm,
      update: { studentEnum: 2, studentStatusEnum: 1, department: null },
    });
    expect(result).toEqual({ ...row, studentEnum: 2 });
  });

  it("preserves each legacy unique key and only updates the original columns", async () => {
    const { repository, tx } = createRepository();
    const student = { ...identity, number: 20262001 };
    await repository.ensureStudent(student);
    await repository.ensureProfessor(identity);
    await repository.ensureProfessorTerm({
      professorId: 13,
      department: 3,
      startTerm,
    });
    await repository.ensureEmployeeTerm({ employeeId: 17, startTerm });

    expect(tx.student.upsert).toHaveBeenCalledWith({
      where: { number: student.number },
      create: student,
      update: identity,
    });
    expect(tx.professor.upsert).toHaveBeenCalledWith({
      where: { email: identity.email },
      create: identity,
      update: { userId: identity.userId, name: identity.name },
    });
    expect(tx.professorT.upsert).toHaveBeenCalledWith({
      where: { professorId: 13 },
      create: { professorId: 13, department: 3, startTerm, professorEnum: 3 },
      update: { professorId: 13, department: 3, startTerm },
    });
    expect(tx.employeeT.upsert).toHaveBeenCalledWith({
      where: { employeeId: 17 },
      create: { employeeId: 17, startTerm },
      update: { employeeId: 17, startTerm },
    });
  });

  it("keeps employee insert behavior because userId and email are not unique", async () => {
    const { repository, tx } = createRepository();
    await repository.ensureEmployee(identity);
    await repository.ensureEmployee(identity);
    expect(tx.employee.create).toHaveBeenCalledTimes(2);
    expect(tx.employee.create).toHaveBeenNthCalledWith(1, { data: identity });
    expect(tx.employee.create).toHaveBeenNthCalledWith(2, { data: identity });
  });

  it("updates deleted executives without restoring them and reads only currently active executive terms", async () => {
    const { repository, tx } = createRepository();
    const queriedAt = new Date("2026-09-15T10:00:00.000Z");
    await repository.updateExecutiveUser(11, 7);
    await expect(
      repository.findActiveExecutives(11, queriedAt),
    ).resolves.toEqual([{ id: 2, studentId: 11 }]);
    expect(tx.executive.updateMany).toHaveBeenCalledWith({
      where: { studentId: 11 },
      data: { userId: 7 },
    });
    expect(tx.executive.findMany).toHaveBeenCalledWith({
      where: {
        studentId: 11,
        deletedAt: null,
        executiveTs: {
          some: {
            startTerm: { lte: queriedAt },
            OR: [{ endTerm: null }, { endTerm: { gte: queriedAt } }],
            deletedAt: null,
          },
        },
      },
      select: { id: true, studentId: true },
      take: 1,
    });
  });

  it.each(upsertCases)(
    "propagates the unique collision for $delegate so the whole transaction can restart",
    async ({ delegate, run }) => {
      const { repository, tx } = createRepository();
      const error = prismaError("P2002");
      tx[delegate].upsert.mockRejectedValueOnce(error);
      await expect(run(repository)).rejects.toBe(error);
      expect(tx[delegate].upsert).toHaveBeenCalledTimes(1);
      expect(tx[delegate].update).not.toHaveBeenCalled();
    },
  );

  it.each([
    new Error("database unavailable"),
    prismaError("P2024"),
    prismaError("P2034"),
  ])("preserves unrelated database errors without a retry", async error => {
    const { repository, tx } = createRepository();
    tx.user.upsert.mockRejectedValue(error);
    await expect(upsertCases[0].run(repository)).rejects.toBe(error);
    expect(tx.user.upsert).toHaveBeenCalledTimes(1);
    expect(tx.user.update).not.toHaveBeenCalled();
  });
});
