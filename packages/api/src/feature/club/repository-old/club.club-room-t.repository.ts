import { Inject, Injectable } from "@nestjs/common";

import { CLOCK, Clock } from "@sparcs-clubs/api/common/clock/clock";
import { PrismaService } from "@sparcs-clubs/api/prisma/prisma.service";

@Injectable()
export class ClubRoomTRepository {
  @Inject(CLOCK) private readonly clock: Clock;

  constructor(private readonly prisma: PrismaService) {}

  async findClubLocationById(
    clubId: number,
  ): Promise<{ room: string | null; buildingName: string | null } | null> {
    const now = this.clock.now();
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
