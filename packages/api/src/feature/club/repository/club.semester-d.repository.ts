import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { and, between, eq, gt, isNull, lte, sql } from "drizzle-orm";
import { MySql2Database } from "drizzle-orm/mysql2";

import { ISemester } from "@sparcs-clubs/interface/api/club/type/semester.type";

import { takeOne } from "@sparcs-clubs/api/common/util/util";
import { DrizzleAsyncProvider } from "@sparcs-clubs/api/drizzle/drizzle.provider";
import { ClubT, SemesterD } from "@sparcs-clubs/api/drizzle/schema/club.schema";

@Injectable()
export default class SemesterDRepository {
  constructor(@Inject(DrizzleAsyncProvider) private db: MySql2Database) {}

  async findByDate(date: Date) {
    const result = await this.db
      .select()
      .from(SemesterD)
      .where(
        and(
          lte(SemesterD.startTerm, date),
          gt(SemesterD.endTerm, date),
          isNull(SemesterD.deletedAt),
        ),
      );

    return result;
  }

  async findSemesterBetweenstartTermAndendTerm(): Promise<{
    id: number;
    name: string;
    createdAt: Date;
    deletedAt: Date;
    year: number;
    startTerm: Date;
    endTerm: Date;
  }> {
    const result = await this.db
      .select()
      .from(SemesterD)
      .where(
        and(
          between(sql`NOW()`, SemesterD.startTerm, SemesterD.endTerm),
          isNull(SemesterD.deletedAt),
        ),
      )
      .then(takeOne);
    return result;
  }

  /**
   * @param clubId 동아리 id
   * @returns 해당 동아리가 등록했던 학기들의 정보를 리턴합니다.
   * 동아리가 등록했던 학기의 구분은 ClubT 테이블을 기준으로 합니다.
   */
  async selectByClubId(param: { clubId: number }) {
    const result = await this.db
      .select()
      .from(SemesterD)
      .innerJoin(ClubT, eq(SemesterD.id, ClubT.semesterId))
      .where(and(eq(ClubT.clubId, param.clubId), isNull(ClubT.deletedAt)))
      .then(e => e.map(({ semester_d }) => semester_d)); // eslint-disable-line camelcase
    return result;
  }

  async fetch(date: Date): Promise<ISemester>;
  async fetch(id: number): Promise<ISemester>;
  async fetch(arg: Date | number): Promise<ISemester> {
    const whereClause = [];
    if (typeof arg === "number") {
      whereClause.push(eq(SemesterD.id, arg));
    }
    if (arg instanceof Date) {
      whereClause.push(
        and(lte(SemesterD.startTerm, arg), gt(SemesterD.endTerm, arg)),
      );
    }
    whereClause.push(isNull(SemesterD.deletedAt));

    const result = await this.db
      .select()
      .from(SemesterD)
      .where(and(...whereClause));

    if (result.length !== 1) {
      throw new NotFoundException(`No semester found for ${arg}`);
    }

    return result[0];
  }
}
