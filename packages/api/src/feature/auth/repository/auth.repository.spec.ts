import { AuthRepository } from "./auth.repository";

describe("AuthRepository", () => {
  const currentDate = new Date("2026-06-10T00:00:00.000Z");

  const createRepository = ({
    studentNumber = 20245642,
    studentTerms = [
      {
        studentId: 29943,
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
            id: 2494,
            sid: "sid",
            name: "조현준",
            email: "hyunjun@example.com",
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
              id: 29943,
              number: studentNumber,
            },
          ])
          .mockResolvedValue([
            {
              id: 29943,
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
      "hyunjun@example.com",
      "20245642",
      "sid",
      "조현준",
      "Student",
      "1234",
      "S",
      "재학",
      "2",
    );

    expect(result.doctor).toEqual({ id: 29943, number: 20245642 });
    expect(result.master).toBeUndefined();
  });

  it("uses the current student_t enum when returning student profiles for token refresh", async () => {
    const { repository } = createRepository();

    const result = await repository.findUserById(2494);

    expect(result.doctor).toEqual({ id: 29943, number: 20245642 });
    expect(result.master).toBeUndefined();
  });

  it("classifies 5000-range students as doctors when falling back to student number", async () => {
    const { repository } = createRepository({ studentTerms: [] });

    const result = await repository.findOrCreateUser(
      "hyunjun@example.com",
      "20245642",
      "sid",
      "조현준",
      "Student",
      "1234",
      "S",
      "재학",
      null,
    );

    expect(result.doctor).toEqual({ id: 29943, number: 20245642 });
    expect(result.master).toBeUndefined();
    expect(result.undergraduate).toBeUndefined();
  });

  it("rejects 6000-range students when falling back to student number", async () => {
    const { repository } = createRepository({
      studentNumber: 20246001,
      studentTerms: [],
    });

    await expect(
      repository.findOrCreateUser(
        "exchange@example.com",
        "20246001",
        "sid",
        "교환학생",
        "Student",
        "1234",
        "S",
        "재학",
        null,
      ),
    ).rejects.toThrow(
      "교환학생의 학적 정보를 추적할 수 없습니다. 관리자에게 문의해주세요.",
    );
  });
});
