import { Inject, Injectable } from "@nestjs/common";
import { and, eq, gte, isNull, lte, or } from "drizzle-orm";
import { MySql2Database } from "drizzle-orm/mysql2";
import { DrizzleAsyncProvider } from "src/drizzle/drizzle.provider";

import { DivisionPermanentClubD } from "@sparcs-clubs/api/drizzle/schema/division.schema";

@Injectable()
export class DivisionPermanentClubDRepository {
  constructor(@Inject(DrizzleAsyncProvider) private db: MySql2Database) {}

  async findPermenantClub(clubId: number, startTerm?: Date): Promise<boolean> {
    const now = new Date();
    const baseStartTerm = startTerm || now;

    return this.db
      .select({ id: DivisionPermanentClubD.id })
      .from(DivisionPermanentClubD)
      .where(
        and(
          eq(DivisionPermanentClubD.clubId, clubId),
          lte(DivisionPermanentClubD.startTerm, baseStartTerm),
          or(
            gte(DivisionPermanentClubD.endTerm, baseStartTerm),
            isNull(DivisionPermanentClubD.endTerm),
          ),
        ),
      )
      .then(result => result.length > 0);
  }
}
