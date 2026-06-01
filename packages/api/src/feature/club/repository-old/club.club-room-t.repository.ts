import { Injectable } from "@nestjs/common";

import { PrismaService } from "@sparcs-clubs/api/prisma/prisma.service";

@Injectable()
export class ClubRoomTRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findClubLocationById(
    clubId: number,
  ): Promise<{ room: string | null; buildingName: string | null } | null> {
    const now = new Date();
    const roomDetails = await this.prisma.clubRoomT.findFirst({
      where: {
        clubId,
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

    return roomDetails
      ? {
          room: roomDetails.roomLocation,
          buildingName: roomDetails.clubBuildingRel.buildingName,
        }
      : null;
  }
}
