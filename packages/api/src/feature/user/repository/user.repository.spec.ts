import UserRepository from "./user.repository";

describe("UserRepository", () => {
  describe("findStudentByStudentNumberNameDate", () => {
    it("finds students with prisma query and maps them to the shape used by user service", async () => {
      const prisma = {
        student: {
          findMany: jest.fn().mockResolvedValue([
            {
              id: 1,
              userId: 2,
              email: "student@kaist.ac.kr",
            },
          ]),
        },
      };
      const repository = new UserRepository(
        prisma as unknown as ConstructorParameters<typeof UserRepository>[0],
      );
      const startTerm = new Date("2025-02-28T15:00:00.000Z");
      const endTerm = new Date("2025-03-31T14:59:00.000Z");

      const result = await repository.findStudentByStudentNumberNameDate(
        "20201234",
        "홍길동",
        startTerm,
        endTerm,
      );

      expect(prisma.student.findMany).toHaveBeenCalledWith({
        where: {
          number: 20201234,
          name: "홍길동",
          deletedAt: null,
          studentTs: {
            some: {
              deletedAt: null,
              startTerm: { lte: startTerm },
              OR: [{ endTerm: { gte: endTerm } }, { endTerm: null }],
            },
          },
        },
        select: {
          id: true,
          userId: true,
          email: true,
        },
      });
      expect(result).toEqual([
        {
          student: {
            id: 1,
            userId: 2,
            email: "student@kaist.ac.kr",
          },
        },
      ]);
    });

    it.each(["invalid", "20201234foo"])(
      "returns empty results for invalid student numbers: %s",
      async studentNumber => {
        const prisma = {
          student: {
            findMany: jest.fn(),
          },
        };
        const repository = new UserRepository(
          prisma as unknown as ConstructorParameters<typeof UserRepository>[0],
        );
        const startTerm = new Date("2025-02-28T15:00:00.000Z");
        const endTerm = new Date("2025-03-31T14:59:00.000Z");

        const result = await repository.findStudentByStudentNumberNameDate(
          studentNumber,
          "홍길동",
          startTerm,
          endTerm,
        );

        expect(prisma.student.findMany).not.toHaveBeenCalled();
        expect(result).toEqual([]);
      },
    );

    it("uses the start date as the student term boundary when end date is null", async () => {
      const prisma = {
        student: {
          findMany: jest.fn().mockResolvedValue([]),
        },
      };
      const repository = new UserRepository(
        prisma as unknown as ConstructorParameters<typeof UserRepository>[0],
      );
      const startTerm = new Date("2025-02-28T15:00:00.000Z");

      await repository.findStudentByStudentNumberNameDate(
        "20201234",
        "홍길동",
        startTerm,
        null,
      );

      expect(prisma.student.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            studentTs: {
              some: {
                deletedAt: null,
                startTerm: { lte: startTerm },
                OR: [{ endTerm: { gte: startTerm } }, { endTerm: null }],
              },
            },
          }),
        }),
      );
    });
  });

  describe("findStudentByStudentNumber", () => {
    it("finds a student by student number for detailed validation", async () => {
      const student = {
        id: 1,
        userId: 2,
        email: "student@kaist.ac.kr",
        name: "홍길동",
      };
      const prisma = {
        student: {
          findFirst: jest.fn().mockResolvedValue(student),
        },
      };
      const repository = new UserRepository(
        prisma as unknown as ConstructorParameters<typeof UserRepository>[0],
      );

      const result = await repository.findStudentByStudentNumber("20201234");

      expect(prisma.student.findFirst).toHaveBeenCalledWith({
        where: {
          number: 20201234,
          deletedAt: null,
        },
        select: {
          id: true,
          userId: true,
          email: true,
          name: true,
        },
      });
      expect(result).toEqual(student);
    });

    it.each(["invalid", "20201234foo"])(
      "returns null for invalid student numbers: %s",
      async studentNumber => {
        const prisma = {
          student: {
            findFirst: jest.fn(),
          },
        };
        const repository = new UserRepository(
          prisma as unknown as ConstructorParameters<typeof UserRepository>[0],
        );

        const result =
          await repository.findStudentByStudentNumber(studentNumber);

        expect(prisma.student.findFirst).not.toHaveBeenCalled();
        expect(result).toBeNull();
      },
    );
  });
});
