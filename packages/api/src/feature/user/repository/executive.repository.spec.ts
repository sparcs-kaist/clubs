import ExecutiveRepository from "./executive.repository";

describe("ExecutiveRepository", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  describe("findExecutiveByUserId", () => {
    it("checks current executives with prisma relation query", async () => {
      jest.useFakeTimers().setSystemTime(new Date("2025-03-15T12:00:00.000Z"));

      const prisma = {
        executive: {
          findFirst: jest.fn().mockResolvedValue({ id: 1 }),
        },
      };
      const repository = new ExecutiveRepository(
        prisma as unknown as ConstructorParameters<
          typeof ExecutiveRepository
        >[0],
      );

      const result = await repository.findExecutiveByUserId(10);

      expect(prisma.executive.findFirst).toHaveBeenCalledWith({
        where: {
          userId: 10,
          deletedAt: null,
          executiveTs: {
            some: {
              deletedAt: null,
              startTerm: { lte: new Date("2025-03-15T12:00:00.000Z") },
              OR: [
                { endTerm: { gte: new Date("2025-03-15T12:00:00.000Z") } },
                { endTerm: null },
              ],
            },
          },
        },
        select: { id: true },
      });
      expect(result).toBe(true);
    });
  });

  describe("checkExistExecutiveByIdDate", () => {
    it("checks overlapping executive terms with prisma relation query", async () => {
      const prisma = {
        executive: {
          findFirst: jest.fn().mockResolvedValue({ id: 1 }),
        },
      };
      const repository = new ExecutiveRepository(
        prisma as unknown as ConstructorParameters<
          typeof ExecutiveRepository
        >[0],
      );
      const startTerm = new Date("2025-02-28T15:00:00.000Z");
      const endTerm = new Date("2025-03-31T14:59:00.000Z");

      const result = await repository.checkExistExecutiveByIdDate(
        1,
        startTerm,
        endTerm,
      );

      expect(prisma.executive.findFirst).toHaveBeenCalledWith({
        where: {
          studentId: 1,
          deletedAt: null,
          executiveTs: {
            some: {
              deletedAt: null,
              startTerm: { lte: endTerm },
              OR: [{ endTerm: { gte: startTerm } }, { endTerm: null }],
            },
          },
        },
        select: { id: true },
      });
      expect(result).toBe(true);
    });

    it("checks open-ended executive terms without a new end boundary", async () => {
      const prisma = {
        executive: {
          findFirst: jest.fn().mockResolvedValue(null),
        },
      };
      const repository = new ExecutiveRepository(
        prisma as unknown as ConstructorParameters<
          typeof ExecutiveRepository
        >[0],
      );
      const startTerm = new Date("2025-02-28T15:00:00.000Z");

      const result = await repository.checkExistExecutiveByIdDate(
        1,
        startTerm,
        null,
        10,
      );

      expect(prisma.executive.findFirst).toHaveBeenCalledWith({
        where: {
          studentId: 1,
          deletedAt: null,
          executiveTs: {
            some: {
              id: { not: 10 },
              deletedAt: null,
              OR: [{ endTerm: { gte: startTerm } }, { endTerm: null }],
            },
          },
        },
        select: { id: true },
      });
      expect(result).toBe(false);
    });
  });

  describe("createExecutive", () => {
    it("creates executive_t rows with prisma create", async () => {
      const tx = {
        executive: {
          findMany: jest.fn().mockResolvedValue([]),
          create: jest.fn().mockResolvedValue({ id: 3 }),
        },
        executiveT: {
          create: jest.fn().mockResolvedValue({ id: 4 }),
        },
      };
      const prisma = {
        $transaction: jest.fn(async callback => callback(tx)),
      };
      const repository = new ExecutiveRepository(
        prisma as unknown as ConstructorParameters<
          typeof ExecutiveRepository
        >[0],
      );
      const startTerm = new Date("2025-02-28T15:00:00.000Z");
      const endTerm = new Date("2025-03-31T14:59:00.000Z");

      const result = await repository.createExecutive(
        1,
        2,
        "student@kaist.ac.kr",
        "홍길동",
        startTerm,
        endTerm,
      );

      expect(tx.executive.create).toHaveBeenCalledWith({
        data: {
          userId: 2,
          studentId: 1,
          email: "student@kaist.ac.kr",
          name: "홍길동",
        },
      });
      expect(tx.executiveT.create).toHaveBeenCalledWith({
        data: {
          executiveId: 3,
          executiveStatusEnum: 1,
          executiveBureauEnum: 1,
          startTerm,
          endTerm,
        },
      });
      expect(result).toBe(true);
    });

    it("creates open-ended executive_t rows with null endTerm", async () => {
      const tx = {
        executive: {
          findMany: jest.fn().mockResolvedValue([{ id: 3, deletedAt: null }]),
          create: jest.fn(),
        },
        executiveT: {
          create: jest.fn().mockResolvedValue({ id: 4 }),
        },
      };
      const prisma = {
        $transaction: jest.fn(async callback => callback(tx)),
      };
      const repository = new ExecutiveRepository(
        prisma as unknown as ConstructorParameters<
          typeof ExecutiveRepository
        >[0],
      );
      const startTerm = new Date("2025-02-28T15:00:00.000Z");

      const result = await repository.createExecutive(
        1,
        2,
        "student@kaist.ac.kr",
        "홍길동",
        startTerm,
        null,
      );

      expect(tx.executive.create).not.toHaveBeenCalled();
      expect(tx.executiveT.create).toHaveBeenCalledWith({
        data: {
          executiveId: 3,
          executiveStatusEnum: 1,
          executiveBureauEnum: 1,
          startTerm,
          endTerm: null,
        },
      });
      expect(result).toBe(true);
    });
  });
});
