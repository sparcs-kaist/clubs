import { UserSsoLoginRepository } from "@sparcs-clubs/api/feature/user/repository/sso-login/user-sso-login.repository";

import type { SsoLoginDiagnostic } from "../util/sso-login-diagnostic";
import { AuthRepository } from "./auth.repository";
import { AuthExchangeLoginRepository } from "./exchange-login/auth-exchange-login.repository";

jest.mock("@sparcs-clubs/api/prisma/prisma.service", () => ({
  PrismaService: class PrismaService {},
}));

describe("AuthRepository", () => {
  const currentDate = new Date("2026-06-10T00:00:00.000Z");
  const mockUserId = 900001;
  const mockStudentId = 900002;
  const mockSid = "test-sid";
  const mockStudentName = "테스트 학생";
  const defaultStudentNumber = 20995042;

  const createRepository = ({
    studentNumber = defaultStudentNumber,
    studentTerms = [
      {
        studentId: mockStudentId,
        studentEnum: 3,
      },
    ],
  }: {
    studentNumber?: number;
    studentTerms?: { studentId: number; studentEnum: number }[];
  } = {}) => {
    const prisma = {
      $queryRaw: jest.fn().mockResolvedValue([]),
      user: {
        upsert: jest.fn().mockResolvedValue({ id: mockUserId }),
        update: jest.fn(),
        findMany: jest.fn().mockResolvedValue([
          {
            id: mockUserId,
            sid: mockSid,
            name: mockStudentName,
            email: "test-student@example.com",
          },
        ]),
      },
      semesterD: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 19,
            startTerm: new Date("2026-03-01T00:00:00.000Z"),
            endTerm: new Date("2026-08-31T23:59:59.000Z"),
          },
        ]),
      },
      student: {
        upsert: jest.fn().mockResolvedValue({ id: mockStudentId }),
        update: jest.fn(),
        findMany: jest
          .fn()
          .mockResolvedValueOnce([
            {
              id: mockStudentId,
              number: studentNumber,
            },
          ])
          .mockResolvedValue([
            {
              id: mockStudentId,
              number: studentNumber,
            },
          ]),
      },
      studentT: {
        upsert: jest.fn().mockResolvedValue({ id: 1 }),
        update: jest.fn(),
        findMany: jest.fn().mockResolvedValue(studentTerms),
      },
      executive: {
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        findMany: jest.fn().mockResolvedValue([]),
      },
      professor: {
        upsert: jest.fn().mockResolvedValue({ id: 2 }),
        update: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
      },
      professorT: {
        upsert: jest.fn().mockResolvedValue({ id: 3 }),
        update: jest.fn(),
      },
      employee: {
        create: jest.fn().mockResolvedValue({ id: 4 }),
        findMany: jest.fn().mockResolvedValue([]),
      },
      employeeT: {
        upsert: jest.fn().mockResolvedValue({ id: 5 }),
        update: jest.fn(),
      },
    };

    const txHost = { tx: prisma } as never;
    const repository = new AuthRepository(
      txHost,
      new UserSsoLoginRepository(txHost),
      new AuthExchangeLoginRepository(txHost),
    );
    const clock = { now: jest.fn().mockReturnValue(currentDate) };
    Object.defineProperty(repository, "clock", { value: clock });

    return { repository, prisma, clock };
  };

  it("uses the current student_t enum when returning student profiles after login", async () => {
    const { repository } = createRepository();

    const result = await repository.findOrCreateUser(
      "test-student@example.com",
      defaultStudentNumber.toString(),
      mockSid,
      mockStudentName,
      "Student",
      "1234",
      "S",
      "재학",
      "2",
    );

    expect(result.doctor).toEqual({
      id: mockStudentId,
      number: defaultStudentNumber,
    });
    expect(result.master).toBeUndefined();
  });

  it("uses SSO V2 as source of truth during login when it conflicts with current student_t", async () => {
    const { repository, prisma } = createRepository();
    prisma.studentT.findMany
      .mockResolvedValueOnce([{ studentId: mockStudentId, studentEnum: 3 }])
      .mockResolvedValueOnce([{ studentId: mockStudentId, studentEnum: 2 }]);

    const result = await repository.findOrCreateUser(
      "test-student@example.com",
      defaultStudentNumber.toString(),
      mockSid,
      mockStudentName,
      "Student",
      "1234",
      "S",
      "재학",
      "1",
    );

    const studentTermUpsert = prisma.studentT.upsert.mock.calls[0][0];
    expect(studentTermUpsert.create.studentEnum).toBe(2);
    expect(studentTermUpsert.update.studentEnum).toBe(2);
    expect(result.master).toEqual({
      id: mockStudentId,
      number: defaultStudentNumber,
    });
    expect(result.doctor).toBeUndefined();
  });

  it("uses the current student_t enum when returning student profiles for token refresh", async () => {
    const { repository } = createRepository();

    const result = await repository.findUserById(mockUserId);

    expect(result.doctor).toEqual({
      id: mockStudentId,
      number: defaultStudentNumber,
    });
    expect(result.master).toBeUndefined();
  });

  it.each([
    ["6000-6899 undergraduate", 20996167, 1, "undergraduate"],
    ["6000-6899 master", 20996614, 2, "master"],
    ["7000+ doctor", 20998109, 3, "doctor"],
  ] as const)(
    "uses the current student_t enum for %s when login has no SSO V2 degree",
    async (_, studentNumber, studentEnum, expectedProfileKey) => {
      const { repository } = createRepository({
        studentNumber,
        studentTerms: [{ studentId: mockStudentId, studentEnum }],
      });

      const result = await repository.findOrCreateUser(
        "student@example.com",
        studentNumber.toString(),
        mockSid,
        mockStudentName,
        "Student",
        "1234",
        "S",
        "재학",
        null,
      );

      expect(result[expectedProfileKey]).toEqual({
        id: mockStudentId,
        number: studentNumber,
      });
    },
  );

  it.each([
    ["0000-1999", "undergraduate", 20991001],
    ["2000-2999", "master", 20992001],
    ["3000-3999", "master", 20993001],
    ["4000-4999", "master", 20994001],
    ["5000-5999", "doctor", 20995001],
  ] as const)(
    "classifies %s as %s when falling back to student number",
    async (_, expectedProfileKey, studentNumber) => {
      const { repository } = createRepository({
        studentNumber,
        studentTerms: [],
      });

      const result = await repository.findOrCreateUser(
        "student@example.com",
        studentNumber.toString(),
        mockSid,
        mockStudentName,
        "Student",
        "1234",
        "S",
        "재학",
        null,
      );

      expect(result[expectedProfileKey]).toEqual({
        id: mockStudentId,
        number: studentNumber,
      });
    },
  );

  it("rejects HP students before SSO, DB, or fallback classification", async () => {
    const { repository } = createRepository({
      studentNumber: 20996901,
      studentTerms: [{ studentId: mockStudentId, studentEnum: 2 }],
    });

    await expect(
      repository.findOrCreateUser(
        "hp@example.com",
        "20996901",
        mockSid,
        mockStudentName,
        "Student",
        "1234",
        "S",
        "재학",
        "1",
      ),
    ).rejects.toThrow("HP 학번은 로그인할 수 없습니다.");
  });

  it.each([
    ["6000-6899", 20996001],
    ["7000+", 20997001],
  ] as const)(
    "rejects %s students when falling back to student number",
    async (_, studentNumber) => {
      const { repository } = createRepository({
        studentNumber,
        studentTerms: [],
      });

      await expect(
        repository.findOrCreateUser(
          "exchange@example.com",
          studentNumber.toString(),
          mockSid,
          mockStudentName,
          "Student",
          "1234",
          "S",
          "재학",
          null,
        ),
      ).rejects.toThrow(
        "교환학생의 학적 정보를 추적할 수 없습니다. 관리자에게 문의해주세요.",
      );
    },
  );

  it("captures the current student failure and the empty query actually used", async () => {
    const studentNumber = "20996001";
    const { repository, prisma } = createRepository({
      studentNumber: Number(studentNumber),
      studentTerms: [],
    });
    const diagnostic: SsoLoginDiagnostic = { stage: "start" };

    await expect(
      repository.findOrCreateUser(
        "student@example.com",
        studentNumber,
        mockSid,
        mockStudentName,
        "Student",
        "1234",
        "S",
        "재학",
        1 as never,
        diagnostic,
      ),
    ).rejects.toThrow("교환학생의 학적 정보를 추적할 수 없습니다.");

    expect(diagnostic).toMatchObject({
      stage: "db.current-degree.resolve",
      userId: mockUserId,
      studentId: mockStudentId,
      db: {
        userQueriedAt: currentDate,
        user: { id: mockUserId },
        semesterQueriedAt: currentDate,
        semester: { id: 19 },
        currentStudentQueriedAt: currentDate,
        currentStudent: {
          id: mockStudentId,
          number: Number(studentNumber),
          ssoNumber: studentNumber,
        },
        resolvingStudent: {
          id: mockStudentId,
          number: studentNumber,
          source: "current",
          progCodeV2: 1,
          hasExistingStudentEnum: false,
          existingStudentEnum: undefined,
        },
        currentStudentTerms: {
          queriedAt: currentDate,
          studentIds: [mockStudentId],
          rows: [],
        },
      },
    });
    expect(diagnostic.db).not.toHaveProperty("linkedStudents");
    expect(prisma.studentT.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.user.upsert).toHaveBeenCalledTimes(1);
    expect(prisma.student.upsert).toHaveBeenCalledTimes(1);
    expect(prisma.studentT.upsert).not.toHaveBeenCalled();
  });

  it("distinguishes a failed student_t query from a successful empty result", async () => {
    const { repository, prisma } = createRepository();
    const diagnostic: SsoLoginDiagnostic = { stage: "start" };
    const error = new Error("student_t unavailable");
    prisma.studentT.findMany.mockRejectedValueOnce(error);

    await expect(
      repository.findOrCreateUser(
        "student@example.com",
        defaultStudentNumber.toString(),
        mockSid,
        mockStudentName,
        "Student",
        "1234",
        "S",
        "재학",
        "2",
        diagnostic,
      ),
    ).rejects.toBe(error);

    expect(diagnostic.stage).toBe("db.current-degree.read");
    expect(diagnostic.db?.currentStudentTerms).toEqual({
      queriedAt: currentDate,
      studentIds: [mockStudentId],
      validityFilter:
        "startTerm <= queriedAt AND (endTerm IS NULL OR endTerm >= queriedAt) AND deletedAt IS NULL",
      orderBy: ["startTerm DESC", "id DESC"],
      selectedFields: ["studentId", "studentEnum"],
    });
  });

  it("retains current and linked student context when a different linked number cannot resolve", async () => {
    const { repository, prisma, clock } = createRepository();
    const linkedStudent = {
      id: mockStudentId + 1,
      number: 20997001,
      userId: mockUserId,
    };
    const currentStudent = {
      id: mockStudentId,
      number: defaultStudentNumber,
      userId: mockUserId,
    };
    const terms = [
      { studentId: mockStudentId, studentEnum: 3 },
      { studentId: mockStudentId, studentEnum: 2 },
    ];
    prisma.student.findMany
      .mockReset()
      .mockResolvedValueOnce([currentStudent])
      .mockResolvedValueOnce([currentStudent, linkedStudent]);
    prisma.studentT.findMany.mockResolvedValue(terms);
    clock.now.mockImplementation(
      () => new Date(currentDate.getTime() + clock.now.mock.calls.length),
    );
    const diagnostic: SsoLoginDiagnostic = { stage: "start" };

    await expect(
      repository.findOrCreateUser(
        "student@example.com",
        defaultStudentNumber.toString(),
        mockSid,
        mockStudentName,
        "Student",
        "1234",
        "S",
        "재학",
        "2",
        diagnostic,
      ),
    ).rejects.toThrow("교환학생의 학적 정보를 추적할 수 없습니다.");

    const currentQuery = prisma.studentT.findMany.mock.calls[0][0];
    const linkedQuery = prisma.studentT.findMany.mock.calls[1][0];
    expect(diagnostic).toMatchObject({
      stage: "db.linked-degree.resolve",
      userId: mockUserId,
      studentId: mockStudentId,
      db: {
        currentStudent,
        linkedStudents: [currentStudent, linkedStudent],
        resolvingStudent: {
          id: linkedStudent.id,
          number: linkedStudent.number,
          source: "linked",
          progCodeV2: null,
          hasExistingStudentEnum: false,
          existingStudentEnum: undefined,
        },
        currentStudentTerms: {
          queriedAt: currentQuery.where.startTerm.lte,
          studentIds: [mockStudentId],
          rows: terms,
        },
        linkedStudentTerms: {
          queriedAt: linkedQuery.where.startTerm.lte,
          studentIds: [mockStudentId, linkedStudent.id],
          rows: terms,
        },
        currentStudentResolution: {
          studentEnum: 3,
          studentStatusEnum: 1,
          departmentId: 1234,
          existingStudentEnum: 3,
        },
      },
    });
    expect(currentQuery.where.startTerm.lte).not.toEqual(
      linkedQuery.where.startTerm.lte,
    );
    expect(currentQuery.where.OR[1].endTerm.gte).toBe(
      currentQuery.where.startTerm.lte,
    );
    expect(linkedQuery.where.OR[1].endTerm.gte).toBe(
      linkedQuery.where.startTerm.lte,
    );
    expect(currentQuery.orderBy).toEqual([
      { startTerm: "desc" },
      { id: "desc" },
    ]);
    expect(currentQuery.where).not.toHaveProperty("semesterId");
    expect(currentQuery.select).toEqual({ studentId: true, studentEnum: true });
    expect(prisma.studentT.findMany).toHaveBeenCalledTimes(2);
    expect(prisma.user.upsert).toHaveBeenCalledTimes(1);
    expect(prisma.student.upsert).toHaveBeenCalledTimes(1);
    expect(prisma.studentT.upsert).toHaveBeenCalledTimes(1);
  });

  it("preserves the student term write failure and the resolved academic context", async () => {
    const { repository, prisma } = createRepository();
    const diagnostic: SsoLoginDiagnostic = { stage: "start" };
    const error = new Error("student term write unavailable");
    prisma.studentT.upsert.mockRejectedValueOnce(error);

    await expect(
      repository.findOrCreateUser(
        "student@example.com",
        defaultStudentNumber.toString(),
        mockSid,
        mockStudentName,
        "Student",
        "1234",
        "S",
        "재학",
        "2",
        diagnostic,
      ),
    ).rejects.toBe(error);

    expect(diagnostic).toMatchObject({
      stage: "db.student_t.write",
      userId: mockUserId,
      studentId: mockStudentId,
      db: {
        currentStudentResolution: {
          studentEnum: 3,
          studentStatusEnum: 1,
          departmentId: 1234,
        },
      },
    });
    expect(prisma.studentT.upsert).toHaveBeenCalledTimes(1);
    expect(prisma.studentT.update).not.toHaveBeenCalled();
    expect(prisma.student.findMany).toHaveBeenCalledTimes(1);
    expect(diagnostic.db).not.toHaveProperty("linkedStudents");
  });

  it("keeps the successful profile and query count when diagnostics are supplied", async () => {
    const { repository, prisma } = createRepository();
    const diagnostic: SsoLoginDiagnostic = { stage: "start" };
    const result = await repository.findOrCreateUser(
      "student@example.com",
      defaultStudentNumber.toString(),
      mockSid,
      mockStudentName,
      "Student",
      "1234",
      "S",
      "재학",
      "2",
      diagnostic,
    );

    expect(result).toEqual({
      id: mockUserId,
      sid: mockSid,
      name: mockStudentName,
      email: "test-student@example.com",
      doctor: { id: mockStudentId, number: defaultStudentNumber },
    });
    expect(diagnostic.db?.executives).toEqual([]);
    expect(prisma.studentT.findMany).toHaveBeenCalledTimes(2);
    expect(prisma.student.findMany).toHaveBeenCalledTimes(2);
    expect(prisma.user.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.semesterD.findMany).toHaveBeenCalledTimes(1);
  });
});
