import { ClubTypeEnum } from "@clubs/interface/common/enum/club.enum";

import { ClubOldRepository } from "./club-old.repository";

const injectTestClock = <T extends object>(target: T): T =>
  Object.assign(target, {
    clock: {
      now: () => new Date(Date.now()),
    },
  });

describe("ClubOldRepository", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  describe("fetchSummaries", () => {
    it("uses Prisma Query API with requested semester ids", async () => {
      const prisma = {
        $queryRaw: jest.fn().mockResolvedValue([]),
        club: {
          findMany: jest.fn().mockResolvedValue([
            {
              id: 201,
              nameKr: "과거 동아리",
              nameEn: "Historical Club",
              divisionId: 601,
              clubTs: [{ clubStatusEnumId: ClubTypeEnum.Provisional }],
            },
          ]),
        },
      };
      const repository = injectTestClock(
        new ClubOldRepository(
          prisma as unknown as ConstructorParameters<
            typeof ClubOldRepository
          >[0],
        ),
      );

      const result = await repository.fetchSummaries([201], [7]);

      expect(prisma.club.findMany).toHaveBeenCalledWith({
        where: {
          id: { in: [201] },
          deletedAt: null,
          clubTs: {
            some: {
              semesterId: { in: [7] },
              deletedAt: null,
            },
          },
        },
        select: {
          id: true,
          nameKr: true,
          nameEn: true,
          divisionId: true,
          clubTs: {
            where: {
              semesterId: { in: [7] },
              deletedAt: null,
            },
            select: {
              clubStatusEnumId: true,
            },
          },
        },
      });
      expect(prisma.$queryRaw).not.toHaveBeenCalled();
      expect(result).toEqual([
        {
          id: 201,
          name: "과거 동아리",
          typeEnum: ClubTypeEnum.Provisional,
          division: { id: 601 },
        },
      ]);
    });

    it("uses Prisma Query API with the current club semester when no semester ids are provided", async () => {
      const now = new Date("2026-06-03T12:00:00.000Z");
      jest.useFakeTimers().setSystemTime(now);

      const prisma = {
        $queryRaw: jest.fn().mockResolvedValue([]),
        club: {
          findMany: jest.fn().mockResolvedValue([
            {
              id: 201,
              nameKr: "현재 동아리",
              nameEn: "Current Club",
              divisionId: 601,
              clubTs: [{ clubStatusEnumId: ClubTypeEnum.Regular }],
            },
          ]),
        },
      };
      const repository = injectTestClock(
        new ClubOldRepository(
          prisma as unknown as ConstructorParameters<
            typeof ClubOldRepository
          >[0],
        ),
      );

      const result = await repository.fetchSummaries([201]);

      const currentClubTWhere = {
        startTerm: { lte: now },
        OR: [{ endTerm: { gte: now } }, { endTerm: null }],
        deletedAt: null,
      };
      expect(prisma.club.findMany).toHaveBeenCalledWith({
        where: {
          id: { in: [201] },
          deletedAt: null,
          clubTs: {
            some: currentClubTWhere,
          },
        },
        select: {
          id: true,
          nameKr: true,
          nameEn: true,
          divisionId: true,
          clubTs: {
            where: currentClubTWhere,
            select: {
              clubStatusEnumId: true,
            },
          },
        },
      });
      expect(prisma.$queryRaw).not.toHaveBeenCalled();
      expect(result).toEqual([
        {
          id: 201,
          name: "현재 동아리",
          typeEnum: ClubTypeEnum.Regular,
          division: { id: 601 },
        },
      ]);
    });

    it("uses the current club semester when an empty semester id list is provided", async () => {
      const now = new Date("2026-06-03T12:00:00.000Z");
      jest.useFakeTimers().setSystemTime(now);

      const prisma = {
        $queryRaw: jest.fn().mockResolvedValue([]),
        club: {
          findMany: jest.fn().mockResolvedValue([]),
        },
      };
      const repository = injectTestClock(
        new ClubOldRepository(
          prisma as unknown as ConstructorParameters<
            typeof ClubOldRepository
          >[0],
        ),
      );

      await repository.fetchSummaries([201], []);

      expect(prisma.club.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            clubTs: {
              some: {
                startTerm: { lte: now },
                OR: [{ endTerm: { gte: now } }, { endTerm: null }],
                deletedAt: null,
              },
            },
          }),
        }),
      );
      expect(prisma.$queryRaw).not.toHaveBeenCalled();
    });
  });
});
