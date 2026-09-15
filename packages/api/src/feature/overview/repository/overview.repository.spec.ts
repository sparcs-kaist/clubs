import { ClubDelegateEnum } from "@clubs/interface/common/enum/club.enum";

import { Clock } from "@sparcs-clubs/api/common/clock/clock";

import { OverviewRepository } from "./overview.repository";

jest.mock("@sparcs-clubs/api/prisma/prisma.service", () => ({
  PrismaService: class PrismaService {},
}));

describe("OverviewRepository", () => {
  const createClock = (now: Date): Clock => ({
    endOfToday: jest.fn(),
    now: jest.fn(() => now),
  });

  describe("club division history", () => {
    it("uses the selected semester club division history when finding delegate overview clubs", async () => {
      const semesterEndTerm = new Date("2024-09-01T14:59:00Z");
      const prisma = {
        semesterD: {
          findFirst: jest.fn().mockResolvedValue({
            id: 15,
            endTerm: semesterEndTerm,
          }),
        },
        clubT: {
          findMany: jest.fn().mockResolvedValue([
            {
              clubStatusEnumId: 1,
              club: {
                id: 1,
                nameKr: "궁극의 맛",
                nameEn: "Ultimate Taste",
                divisionId: 11,
                clubDivisionHistories: [
                  {
                    division: {
                      name: "생활문화",
                      district: { name: "생활문화" },
                    },
                  },
                ],
              },
            },
          ]),
        },
        division: {
          findMany: jest.fn().mockResolvedValue([
            {
              id: 11,
              name: "식생활",
              district: { name: "생활문화" },
            },
          ]),
        },
      };
      const repository = new OverviewRepository(
        prisma as never,
        createClock(new Date("2026-06-11T00:00:00Z")),
      );

      await expect(
        repository.findClubsFundamentals(2024, "봄"),
      ).resolves.toEqual([
        {
          clubId: 1,
          division: "생활문화",
          district: "생활문화",
          clubNameKr: "궁극의 맛",
          clubNameEn: "Ultimate Taste",
          clubStatus: 1,
        },
      ]);
      expect(prisma.clubT.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ semesterId: 15 }),
        }),
      );
    });

    it("uses the selected semester club division history when finding club info overview clubs", async () => {
      const semesterEndTerm = new Date("2024-09-01T14:59:00Z");
      const prisma = {
        semesterD: {
          findFirst: jest.fn().mockResolvedValue({
            id: 15,
            endTerm: semesterEndTerm,
          }),
        },
        clubT: {
          findMany: jest.fn().mockResolvedValue([
            {
              clubStatusEnumId: 1,
              characteristicKr: "커피",
              characteristicEn: "Coffee",
              professor: {
                deletedAt: null,
                user: { name: "지도교수" },
              },
              club: {
                id: 5,
                nameKr: "칼디",
                nameEn: "Kaldea",
                description: "커피 동아리",
                foundingYear: 2011,
                divisionId: 11,
                clubRoomTs: [
                  {
                    clubBuildingEnum: 1,
                    roomLocation: "N11",
                    roomPassword: "1234",
                  },
                ],
                clubDivisionHistories: [
                  {
                    division: {
                      name: "생활문화",
                      district: { name: "생활문화" },
                    },
                  },
                ],
              },
            },
          ]),
        },
        division: {
          findMany: jest.fn().mockResolvedValue([
            {
              id: 11,
              name: "식생활",
              district: { name: "생활문화" },
            },
          ]),
        },
        clubStudentT: {
          findMany: jest.fn().mockResolvedValue([
            { clubId: 5, studentId: 1 },
            { clubId: 5, studentId: 2 },
          ]),
        },
        registrationApplicationStudent: {
          findMany: jest.fn().mockResolvedValue([{ clubId: 5, studentId: 1 }]),
        },
      };
      const repository = new OverviewRepository(
        prisma as never,
        createClock(new Date("2026-06-11T00:00:00Z")),
      );

      await expect(repository.findClubs(2024, "봄")).resolves.toEqual([
        {
          clubId: 5,
          division: "생활문화",
          district: "생활문화",
          clubNameKr: "칼디",
          clubNameEn: "Kaldea",
          clubStatus: 1,
          description: "커피 동아리",
          characteristicKr: "커피",
          characteristicEn: "Coffee",
          advisor: "지도교수",
          foundingYear: 2011,
          clubBuildingEnum: 1,
          roomLocation: "N11",
          roomPassword: "1234",
          totalMemberCnt: 2n,
          regularMemberCnt: 1n,
        },
      ]);
    });

    it("keeps club info overview clubs when professor or room data is missing", async () => {
      const semesterEndTerm = new Date("2026-08-28T14:59:00Z");
      const prisma = {
        semesterD: {
          findFirst: jest.fn().mockResolvedValue({
            id: 19,
            endTerm: semesterEndTerm,
          }),
        },
        clubT: {
          findMany: jest.fn().mockResolvedValue([
            {
              clubStatusEnumId: 1,
              characteristicKr: "커피",
              characteristicEn: "Coffee",
              professor: null,
              club: {
                id: 5,
                nameKr: "칼디",
                nameEn: "Kaldea",
                description: "커피 동아리",
                foundingYear: 2011,
                divisionId: 11,
                clubRoomTs: [],
                clubDivisionHistories: [],
              },
            },
          ]),
        },
        division: {
          findMany: jest.fn().mockResolvedValue([
            {
              id: 11,
              name: "식생활",
              district: { name: "생활문화" },
            },
          ]),
        },
        clubStudentT: {
          findMany: jest.fn().mockResolvedValue([
            { clubId: 5, studentId: 1 },
            { clubId: 5, studentId: 2 },
          ]),
        },
        registrationApplicationStudent: {
          findMany: jest.fn().mockResolvedValue([{ clubId: 5, studentId: 1 }]),
        },
      };
      const repository = new OverviewRepository(
        prisma as never,
        createClock(new Date("2026-06-11T00:00:00Z")),
      );

      await expect(repository.findClubs(2026, "봄")).resolves.toEqual([
        {
          clubId: 5,
          division: "식생활",
          district: "생활문화",
          clubNameKr: "칼디",
          clubNameEn: "Kaldea",
          clubStatus: 1,
          description: "커피 동아리",
          characteristicKr: "커피",
          characteristicEn: "Coffee",
          advisor: null,
          foundingYear: 2011,
          clubBuildingEnum: null,
          roomLocation: null,
          roomPassword: null,
          totalMemberCnt: 2n,
          regularMemberCnt: 1n,
        },
      ]);
    });
  });

  describe("findDelegates", () => {
    it("uses the selected semester student row when mapping delegates", async () => {
      const now = new Date("2026-06-11T00:00:00Z");
      const prisma = {
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
