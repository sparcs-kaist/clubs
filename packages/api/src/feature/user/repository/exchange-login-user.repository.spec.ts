import {
  ExchangeLoginEmployeeIdentityRepository,
  ExchangeLoginExecutiveIdentityRepository,
  ExchangeLoginProfessorIdentityRepository,
  ExchangeLoginStudentIdentityRepository,
  ExchangeLoginUserIdentityRepository,
} from "./exchange-login-identity.repository";
import { ExchangeLoginUserRepository } from "./exchange-login-user.repository";

jest.mock("@sparcs-clubs/api/prisma/prisma.service", () => ({
  PrismaService: class PrismaService {},
}));

describe("ExchangeLoginUserRepository", () => {
  const user = { id: 10, sid: "sso-id", name: "사용자", email: "user@test.kr" };
  const student = {
    id: 20,
    userId: 10,
    number: 20260001,
    name: "학생",
    email: null,
  };
  const professor = {
    id: 30,
    userId: 10,
    name: "교수",
    email: "other@test.kr",
  };

  const setup = () => {
    const prisma = {
      user: { findMany: jest.fn().mockResolvedValue([]) },
      student: { findMany: jest.fn().mockResolvedValue([]) },
      professor: { findMany: jest.fn().mockResolvedValue([]) },
      employee: { findMany: jest.fn().mockResolvedValue([]) },
      executive: { findMany: jest.fn().mockResolvedValue([]) },
      $transaction: jest.fn(),
    };
    prisma.$transaction.mockImplementation(callback => callback(prisma));
    const attach = <T extends object>(repository: T) => {
      Object.defineProperty(repository, "prisma", { value: prisma });
      return repository;
    };
    const repository = new ExchangeLoginUserRepository(
      attach(new ExchangeLoginUserIdentityRepository()),
      attach(new ExchangeLoginStudentIdentityRepository()),
      attach(new ExchangeLoginProfessorIdentityRepository()),
      attach(new ExchangeLoginEmployeeIdentityRepository()),
      attach(new ExchangeLoginExecutiveIdentityRepository()),
    );
    return { prisma, repository };
  };

  it("matches all email sources, deduplicates accounts and excludes unlinked profiles", async () => {
    const { prisma, repository } = setup();
    prisma.user.findMany.mockResolvedValue([user]);
    prisma.student.findMany.mockResolvedValue([
      student,
      { ...student, id: 21, userId: null },
    ]);
    prisma.professor.findMany.mockResolvedValue([professor]);
    prisma.employee.findMany.mockResolvedValue([{ ...professor, id: 40 }]);
    prisma.executive.findMany.mockResolvedValue([{ ...professor, id: 50 }]);

    expect(
      await repository.searchExchangeLoginUsers({
        type: "email",
        value: user.email,
      }),
    ).toEqual([
      {
        userId: 10,
        name: user.name,
        email: user.email,
        students: [{ studentId: 20, studentNumber: 20260001 }],
        professors: [{ professorId: 30 }],
      },
    ]);
    (
      ["user", "student", "professor", "employee", "executive"] as const
    ).forEach(model => {
      expect(prisma[model].findMany).toHaveBeenNthCalledWith(1, {
        where: { AND: [{ deletedAt: null }, { email: user.email }] },
      });
    });
    expect(prisma.user.findMany).toHaveBeenLastCalledWith({
      where: { AND: [{ deletedAt: null }, { id: { in: [10] } }] },
      orderBy: [{ id: "asc" }],
    });
  });

  it.each([["employee"], ["executive"]] as const)(
    "finds an account through only its %s email",
    async model => {
      const { prisma, repository } = setup();
      prisma.user.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([user]);
      prisma[model].findMany.mockResolvedValue([{ ...professor, id: 40 }]);
      expect(
        await repository.searchExchangeLoginUsers({
          type: "email",
          value: "alias@test.kr",
        }),
      ).toEqual([
        {
          userId: user.id,
          name: user.name,
          email: user.email,
          students: [],
          professors: [],
        },
      ]);
    },
  );

  it("keeps separate accounts sharing an email and associates only their own profiles", async () => {
    const { prisma, repository } = setup();
    const otherUser = { ...user, id: 11, name: "다른 사용자" };
    prisma.user.findMany.mockResolvedValue([user, otherUser]);
    prisma.student.findMany.mockResolvedValue([student]);
    prisma.professor.findMany.mockResolvedValue([
      { ...professor, userId: otherUser.id },
    ]);
    const result = await repository.searchExchangeLoginUsers({
      type: "email",
      value: user.email,
    });
    expect(result).toEqual([
      {
        userId: user.id,
        name: user.name,
        email: user.email,
        students: [{ studentId: student.id, studentNumber: student.number }],
        professors: [],
      },
      {
        userId: otherUser.id,
        name: otherUser.name,
        email: otherUser.email,
        students: [],
        professors: [{ professorId: professor.id }],
      },
    ]);
  });

  it.each([
    ["studentId", "student", "id", "20"],
    ["studentNumber", "student", "number", "20260001"],
    ["professorId", "professor", "id", "30"],
  ] as const)(
    "resolves %s through its own numeric identifier",
    async (type, model, field, value) => {
      const { prisma, repository } = setup();
      prisma.user.findMany.mockResolvedValue([user]);
      prisma.student.findMany.mockResolvedValue([student]);
      prisma.professor.findMany.mockResolvedValue([professor]);

      const result = await repository.searchExchangeLoginUsers({ type, value });
      expect(result[0].userId).toBe(10);
      expect(prisma[model].findMany).toHaveBeenNthCalledWith(1, {
        where: { AND: [{ deletedAt: null }, { [field]: Number(value) }] },
      });
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: { AND: [{ deletedAt: null }, { id: { in: [10] } }] },
        orderBy: [{ id: "asc" }],
      });
    },
  );

  it("returns no account for an unlinked or missing profile", async () => {
    const { prisma, repository } = setup();
    prisma.professor.findMany.mockResolvedValueOnce([
      { ...professor, userId: null },
    ]);
    expect(
      await repository.searchExchangeLoginUsers({
        type: "professorId",
        value: "30",
      }),
    ).toEqual([]);
    expect(prisma.user.findMany).not.toHaveBeenCalled();
    expect(
      await repository.searchExchangeLoginUsers({
        type: "studentId",
        value: "99",
      }),
    ).toEqual([]);
  });

  it("excludes a deleted linked user and never falls back to a different email account", async () => {
    const { prisma, repository } = setup();
    prisma.professor.findMany.mockResolvedValue([professor]);
    expect(
      await repository.searchExchangeLoginUsers({
        type: "professorId",
        value: "30",
      }),
    ).toEqual([]);
    expect(prisma.user.findMany).toHaveBeenCalledWith({
      where: { AND: [{ deletedAt: null }, { id: { in: [10] } }] },
      orderBy: [{ id: "asc" }],
    });
  });

  it("safely resolves active user identity and preserves nullable SSO fields", async () => {
    const { prisma, repository } = setup();
    expect(await repository.getExchangeLoginUserById(10)).toBeNull();
    prisma.user.findMany.mockResolvedValueOnce([user]);
    expect(await repository.getExchangeLoginUserById(10)).toEqual(user);
    prisma.user.findMany.mockResolvedValueOnce([
      { ...user, sid: null, email: null },
    ]);
    expect(await repository.getExchangeLoginUserById(10)).toEqual({
      ...user,
      sid: null,
      email: null,
    });
    expect(prisma.user.findMany).toHaveBeenLastCalledWith({
      where: { AND: [{ deletedAt: null }, { id: 10 }] },
    });
  });
});
