import { Inject, Injectable } from "@nestjs/common";
import { and, desc, eq, gte, isNull, lte, or } from "drizzle-orm";
import { MySql2Database } from "drizzle-orm/mysql2";
import { getKSTDate, takeOne } from "src/common/util/util";
import { DrizzleAsyncProvider } from "src/drizzle/drizzle.provider";
import { ClubBuildingEnum, ClubRoomT } from "src/drizzle/schema/club.schema";

@Injectable()
export class ClubRoomTRepository {
  constructor(@Inject(DrizzleAsyncProvider) private db: MySql2Database) {}

  async findClubLocationById(
    clubId: number,
  ): Promise<{ room: string; buildingName: string }> {
    const currentDate = getKSTDate();

    const roomDetails = await this.db
      .select({
        room: ClubRoomT.roomLocation,
        buildingName: ClubBuildingEnum.buildingName,
      })
      .from(ClubRoomT)
      .leftJoin(
        ClubBuildingEnum,
        eq(ClubRoomT.clubBuildingEnum, ClubBuildingEnum.id),
      )
      .where(
        and(
          eq(ClubRoomT.clubId, clubId),
          lte(ClubRoomT.startTerm, currentDate),
          or(gte(ClubRoomT.endTerm, currentDate), isNull(ClubRoomT.endTerm)),
        ),
      )
      .orderBy(desc(ClubRoomT.createdAt))
      .limit(1)
      .then(takeOne);

    return roomDetails;
  }
}
