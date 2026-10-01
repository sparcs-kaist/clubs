import { Inject, Injectable } from "@nestjs/common";

import { ClubBuildingEnum } from "@clubs/domain/club/club-semester";

import { CLOCK, Clock } from "@sparcs-clubs/api/common/clock/clock";
import { withDeleted } from "@sparcs-clubs/api/common/util/soft-delete";
import { PrismaService } from "@sparcs-clubs/api/prisma/prisma.service";

// Preserve the names previously served from club_building_enum.
const clubBuildingNames: Partial<Record<ClubBuildingEnum, string>> = {
  [ClubBuildingEnum.Taeul]: "태울관(N13)",
  [ClubBuildingEnum.Store]: "학부학생회관별관(N12)",
  [ClubBuildingEnum.Post]: "학부학생회관(N11)",
  [ClubBuildingEnum.Sports]: "스포츠컴플렉스(N3)",
};

@Injectable()
export class ClubRoomTRepository {
  @Inject(CLOCK) private readonly clock: Clock;

  constructor(private readonly prisma: PrismaService) {}

  async findClubLocationById(
    clubId: number,
  ): Promise<{ room: string | null; buildingName: string | null } | null> {
    const now = this.clock.now();
    const roomDetails = await this.prisma.clubRoomT.findFirst({
      where: withDeleted({
        clubId,
        startTerm: { lte: now },
        OR: [{ endTerm: { gte: now } }, { endTerm: null }],
      }),
      orderBy: { createdAt: "desc" },
      select: {
        roomLocation: true,
        clubBuildingEnum: true,
      },
    });

    return roomDetails
      ? {
          room: roomDetails.roomLocation,
          buildingName:
            clubBuildingNames[
              roomDetails.clubBuildingEnum as ClubBuildingEnum
            ] ?? null,
        }
      : null;
  }
}
