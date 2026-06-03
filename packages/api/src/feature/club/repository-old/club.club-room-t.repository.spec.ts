import { ClubRoomTRepository } from "./club.club-room-t.repository";

const injectTestClock = <T extends object>(target: T): T =>
  Object.assign(target, {
    clock: {
      now: () => new Date(Date.now()),
    },
  });

describe("ClubRoomTRepository", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  describe("findClubLocationById", () => {
    it("finds the latest current club room with Prisma Query API", async () => {
      const now = new Date("2026-06-02T12:00:00.000Z");
      jest.useFakeTimers().setSystemTime(now);

      const prisma = {
        clubRoomT: {
          findFirst: jest.fn().mockResolvedValue({
            roomLocation: "301",
            clubBuildingRel: { buildingName: "N1" },
          }),
        },
      };
      const repository = injectTestClock(
        new ClubRoomTRepository(
          prisma as unknown as ConstructorParameters<
            typeof ClubRoomTRepository
          >[0],
        ),
      );

      const result = await repository.findClubLocationById(10);

      expect(prisma.clubRoomT.findFirst).toHaveBeenCalledWith({
        where: {
          clubId: 10,
          startTerm: { lte: now },
          OR: [{ endTerm: { gte: now } }, { endTerm: null }],
        },
        orderBy: { createdAt: "desc" },
        select: {
          roomLocation: true,
          clubBuildingRel: {
            select: { buildingName: true },
          },
        },
      });
      expect(result).toEqual({ room: "301", buildingName: "N1" });
    });

    it("returns null when no current club room exists", async () => {
      jest.useFakeTimers().setSystemTime(new Date("2026-06-02T12:00:00.000Z"));

      const prisma = {
        clubRoomT: {
          findFirst: jest.fn().mockResolvedValue(null),
        },
      };
      const repository = injectTestClock(
        new ClubRoomTRepository(
          prisma as unknown as ConstructorParameters<
            typeof ClubRoomTRepository
          >[0],
        ),
      );

      const result = await repository.findClubLocationById(10);

      expect(result).toBeNull();
    });
  });
});
