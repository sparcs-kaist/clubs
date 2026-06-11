import { ClubDelegateEnum } from "@clubs/interface/common/enum/club.enum";

import { OverviewRepository } from "./overview.repository";

jest.mock("@sparcs-clubs/api/prisma/prisma.service", () => ({
  PrismaService: class PrismaService {},
}));

describe("OverviewRepository", () => {
  describe("findDelegates", () => {
    it("uses the selected semester student row when mapping delegates", async () => {
      const prisma = {
        $queryRaw: jest.fn().mockResolvedValue([]),
        semesterD: {
          findFirst: jest.fn().mockResolvedValue({ id: 19 }),
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
      const repository = new OverviewRepository(prisma as never);

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
        select: { id: true },
      });
      expect(prisma.clubDelegateD.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            club: expect.objectContaining({
              clubTs: { some: { semesterId: 19, deletedAt: null } },
            }),
          }),
        }),
      );
      expect(prisma.$queryRaw).not.toHaveBeenCalled();
    });
  });
});
