import { Injectable } from "@nestjs/common";

import { PrismaService } from "@sparcs-clubs/api/prisma/prisma.service";

@Injectable()
export class ClubOverviewRoomRepository {
  constructor(private readonly prisma: PrismaService) {}

  findBySemester(clubIds: number[], semesterId: number) {
    return this.prisma.clubRoomT.findMany({
      where: { clubId: { in: clubIds }, semesterId, deletedAt: null },
      select: {
        clubId: true,
        clubBuildingEnum: true,
        roomLocation: true,
        roomPassword: true,
      },
    });
  }
}
