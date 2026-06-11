import { ClubDelegateEnum } from "@clubs/interface/common/enum/club.enum";

import { Clock } from "@sparcs-clubs/api/common/clock/clock";

import { OverviewRepository } from "./overview.repository";

jest.mock("@sparcs-clubs/api/prisma/prisma.service", () => ({
  PrismaService: class PrismaService {},
}));

describe("OverviewRepository", () => {
  describe("findDelegates", () => {
    const createClock = (now: Date): Clock => ({
      endOfToday: jest.fn(),
      now: jest.fn(() => now),
    });

    it("uses the selected semester student row when mapping delegates", async () => {
      const now = new Date("2026-06-11T00:00:00Z");
      const prisma = {
        $queryRaw: jest.fn().mockResolvedValue([]),
        semesterD: {
          findFirst: jest.fn().mockResolvedValue({
            id: 19,
            startTerm: new Date("2026-03-01T00:00:00Z"),
            endTerm: new Date("2026-08-31T14:59:59Z"),
          }),
        },
        clubDelegateD: {
          findMany: jest.fn().mockResolvedValue([
            {
              clubId: 8,
              clubDelegateEnum: ClubDelegateEnum.Representative,
              student: {
                number: 20261234,
                name: "학생 이름",
                email: "representative@kaist.ac.kr",
                user: {
                  name: "대표자",
                  phoneNumber: "010-1234-5678",
                },
                studentTs: [{ department: 42 }],
              },
            },
          ]),
        },
        department: {
          findMany: jest
            .fn()
            .mockResolvedValue([{ departmentId: 42, name: "전산학부" }]),
        },
      };
      const repository = new OverviewRepository(
        prisma as never,
        createClock(now),
      );

      await expect(repository.findDelegates(2026, "가을")).resolves.toEqual([
        {
          clubId: 8,
          delegateType: ClubDelegateEnum.Representative,
          name: "대표자",
          studentNumber: 20261234,
          phoneNumber: "010-1234-5678",
          kaistEmail: "representative@kaist.ac.kr",
          department: "전산학부",
        },
      ]);

      expect(prisma.semesterD.findFirst).toHaveBeenCalledWith({
        where: { year: 2026, name: "가을", deletedAt: null },
        select: { endTerm: true, id: true, startTerm: true },
      });
      expect(prisma.clubDelegateD.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [{ endTerm: null }, { endTerm: { gt: now } }],
            startTerm: { lte: now },
            club: expect.objectContaining({
              clubTs: { some: { semesterId: 19, deletedAt: null } },
            }),
          }),
        }),
      );
      expect(prisma.$queryRaw).not.toHaveBeenCalled();
    });

    it("uses the selected semester start term as delegate criteria for future semesters", async () => {
      const now = new Date("2026-06-11T00:00:00Z");
      const semesterStartTerm = new Date("2026-09-01T00:00:00Z");
      const prisma = {
        semesterD: {
          findFirst: jest.fn().mockResolvedValue({
            id: 20,
            startTerm: semesterStartTerm,
            endTerm: new Date("2026-12-31T14:59:59Z"),
          }),
        },
        clubDelegateD: {
          findMany: jest.fn().mockResolvedValue([]),
        },
        department: {
          findMany: jest.fn().mockResolvedValue([]),
        },
      };
      const repository = new OverviewRepository(
        prisma as never,
        createClock(now),
      );

      await repository.findDelegates(2026, "가을");

      expect(prisma.clubDelegateD.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [{ endTerm: null }, { endTerm: { gt: semesterStartTerm } }],
            startTerm: { lte: semesterStartTerm },
          }),
        }),
      );
    });

    it("uses the selected semester end term as delegate criteria for past semesters", async () => {
      const now = new Date("2026-06-11T00:00:00Z");
      const semesterEndTerm = new Date("2025-12-31T14:59:59Z");
      const prisma = {
        semesterD: {
          findFirst: jest.fn().mockResolvedValue({
            id: 17,
            startTerm: new Date("2025-09-01T00:00:00Z"),
            endTerm: semesterEndTerm,
          }),
        },
        clubDelegateD: {
          findMany: jest.fn().mockResolvedValue([]),
        },
        department: {
          findMany: jest.fn().mockResolvedValue([]),
        },
      };
      const repository = new OverviewRepository(
        prisma as never,
        createClock(now),
      );

      await repository.findDelegates(2025, "가을");

      expect(prisma.clubDelegateD.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [{ endTerm: null }, { endTerm: { gt: semesterEndTerm } }],
            startTerm: { lte: semesterEndTerm },
          }),
        }),
      );
    });
  });
});
