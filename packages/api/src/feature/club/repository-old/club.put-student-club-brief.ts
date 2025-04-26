import { Inject, Injectable } from "@nestjs/common";
import { sql } from "drizzle-orm";
import { MySql2Database } from "drizzle-orm/mysql2";

import { getKSTDate } from "@sparcs-clubs/api/common/util/util";
import { DrizzleAsyncProvider } from "@sparcs-clubs/api/drizzle/drizzle.provider";
import {
  Club,
  ClubRoomT,
  ClubT,
} from "@sparcs-clubs/api/drizzle/schema/club.schema";

@Injectable()
export class ClubPutStudentClubBrief {
  constructor(@Inject(DrizzleAsyncProvider) private db: MySql2Database) {}

  async putStudentClubBrief(
    clubId: number,
    description: string,
    roomPassword: string,
  ): Promise<boolean> {
    const crt = getKSTDate();
    await this.db.transaction(async tx => {
      const [result] = await this.db.execute(sql`
      UPDATE ${ClubT}
      LEFT JOIN ${Club} ON (${ClubT.clubId} = ${Club.id} AND (${Club.deletedAt} IS NULL))
      LEFT JOIN ${ClubRoomT} ON 
        (${ClubT.clubId} = ${ClubRoomT.clubId} AND 
          (
            (${ClubRoomT.endTerm} IS NULL AND ${ClubRoomT.startTerm} <= ${crt})
            OR (${ClubRoomT.endTerm} >= ${crt})
          )
        )
      SET ${Club.description} = ${description}, ${ClubRoomT.roomPassword} = ${roomPassword}
      WHERE (${ClubT.clubId} = ${clubId}
      AND ((${ClubT.endTerm} IS NULL AND ${ClubT.startTerm} <= ${crt})
      OR (${ClubT.endTerm} >= ${crt})));`); // 수정 필요. 트랜잭션 넣어야 할거 같음.
      const { affectedRows } = result;
      if (affectedRows !== 1) {
        await tx.rollback();
      }
    });
    return true;
  }
}
