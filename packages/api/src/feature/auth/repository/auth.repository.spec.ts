import { AuthRepository } from "./auth.repository";

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
      $executeRaw: jest.fn().mockResolvedValue(undefined),
      $queryRaw: jest.fn().mockResolvedValue([]),
      user: {
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
        findMany: jest.fn().mockResolvedValue(studentTerms),
      },
      executive: {
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        findMany: jest.fn().mockResolvedValue([]),
      },
      professor: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      employee: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    const repository = new AuthRepository(prisma as never);
    Object.defineProperty(repository, "clock", {
      value: { now: () => currentDate },
    });

    return { repository, prisma };
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

    const studentTermUpsert = prisma.$executeRaw.mock.calls
      .map(([query]) => query as { strings: string[]; values: unknown[] })
      .find(query => query.strings.join("").includes("INSERT INTO student_t"));

    expect(studentTermUpsert?.values[1]).toBe(2);
    expect(studentTermUpsert?.values[7]).toBe(2);
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
});
