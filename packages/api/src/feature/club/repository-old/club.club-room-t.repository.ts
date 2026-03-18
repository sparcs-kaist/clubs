import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { takeOne } from "@sparcs-clubs/api/common/util/util";
import { PrismaService } from "@sparcs-clubs/api/prisma/prisma.service";

@Injectable()
export class ClubRoomTRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findClubLocationById(
    clubId: number,
  ): Promise<{ room: string; buildingName: string }> {
    const roomDetails = await this.prisma.$queryRaw<
      Array<{ room: string | null; buildingName: string | null }>
    >(Prisma.sql`
      SELECT crt.room_location AS room, cbe.building_name AS buildingName
      FROM club_room_t crt
      LEFT JOIN club_building_enum cbe ON crt.club_building_enum = cbe.id
      WHERE crt.club_id = ${clubId}
        AND crt.start_term <= NOW()
        AND (crt.end_term >= NOW() OR crt.end_term IS NULL)
      ORDER BY crt.created_at DESC
      LIMIT 1
    `);

    return takeOne(roomDetails);
  }
}
