import { Inject, Injectable } from "@nestjs/common";
import { and, eq, gte, isNull, lte, or } from "drizzle-orm";
import { MySql2Database } from "drizzle-orm/mysql2";

import type { ApiClb004ResponseOK } from "@sparcs-clubs/interface/api/club/endpoint/apiClb004";

import { getKSTDate, takeOne } from "@sparcs-clubs/api/common/util/util";
import { DrizzleAsyncProvider } from "@sparcs-clubs/api/drizzle/drizzle.provider";
import {
  Club,
  ClubRoomT,
  ClubT,
} from "@sparcs-clubs/api/drizzle/schema/club.schema";

@Injectable()
export class ClubGetStudentClubBrief {
  constructor(@Inject(DrizzleAsyncProvider) private db: MySql2Database) {}

  async getStudentClubBrief(clubId: number): Promise<ApiClb004ResponseOK> {
    const crt = getKSTDate();
    const result = await this.db
      .select({
        description: Club.description,
        roomPassword: ClubRoomT.roomPassword,
      })
      .from(ClubT)
      .leftJoin(Club, and(eq(ClubT.clubId, Club.id), isNull(Club.deletedAt)))
      .leftJoin(
        ClubRoomT,
        and(
          eq(ClubT.clubId, ClubRoomT.clubId),
          or(
            and(isNull(ClubRoomT.endTerm), lte(ClubRoomT.startTerm, crt)),
            and(gte(ClubRoomT.endTerm, crt), lte(ClubRoomT.startTerm, crt)),
          ),
        ),
      )
      .where(
        and(
          eq(ClubT.clubId, clubId),
          or(
            and(isNull(ClubT.endTerm), lte(ClubT.startTerm, crt)),
            and(gte(ClubT.endTerm, crt), lte(ClubT.startTerm, crt)),
          ),
        ),
      )
      .limit(1)
      .then(takeOne);
    return result;
  }
}
