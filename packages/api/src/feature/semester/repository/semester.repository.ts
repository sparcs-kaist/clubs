import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import {
  and,
  between,
  count,
  desc,
  eq,
  gt,
  InferSelectModel,
  isNull,
  lt,
  lte,
  not,
  or,
  sql,
} from "drizzle-orm";
import { MySql2Database } from "drizzle-orm/mysql2";

import { ISemester } from "@sparcs-clubs/interface/api/semester/type/semester.type";

import { takeUnique } from "@sparcs-clubs/api/common/util/util";
import {
  DrizzleAsyncProvider,
  DrizzleTransaction,
} from "@sparcs-clubs/api/drizzle/drizzle.provider";
import { ClubT } from "@sparcs-clubs/api/drizzle/schema/club.schema";
import { SemesterD } from "@sparcs-clubs/api/drizzle/schema/semester.schema";

import { MSemester } from "../model/semester.model";

interface ISemesterQuery {
  id?: number;
  date?: Date;
  duration?: {
    startTerm: Date;
    endTerm: Date;
  };
}

@Injectable()
export default class SemesterRepository {
  constructor(@Inject(DrizzleAsyncProvider) private db: MySql2Database) {}

  async withTransaction<T>(
    callback: (tx: DrizzleTransaction) => Promise<T>,
  ): Promise<T> {
    return this.db.transaction(callback);
  }

  /**
   * @param offset      페이지네이션의 시작점 (1부터 시작)
   * @param itemCount   페이지에 표시할 항목의 수
   * @returns           최신순으로 정렬된 학기 목록에서 (offset-1) * itemCount부터 itemCount개의 항목을 가져옵니다.
   *                    전체 학기의 개수도 함께 반환합니다.
   */
  async selectSemesterByOffsetAndItemCount(param: {
    offset: number;
    itemCount: number;
  }): Promise<{
    semesters: InferSelectModel<typeof SemesterD>[];
    total: number;
  }> {
    const numberOfSemesters = (
      await this.db
        .select({ count: count() })
        .from(SemesterD)
        .where(isNull(SemesterD.deletedAt))
    ).at(0).count;

    const offset = (param.offset - 1) * param.itemCount;
    const semesters = await this.db
      .select()
      .from(SemesterD)
      .where(isNull(SemesterD.deletedAt))
      .orderBy(desc(SemesterD.id))
      .limit(param.itemCount)
      .offset(offset);

    return {
      semesters,
      total: numberOfSemesters,
    };
  }

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
      .then(takeUnique);
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

  async findTx(
    tx: DrizzleTransaction,
    param: ISemesterQuery,
  ): Promise<MSemester[]> {
    const whereClause = [isNull(SemesterD.deletedAt)];

    if (param.id) {
      whereClause.push(eq(SemesterD.id, param.id));
    }
    if (param.date) {
      whereClause.push(
        and(
          lte(SemesterD.startTerm, param.date),
          gt(SemesterD.endTerm, param.date),
        ),
      );
    }
    if (param.duration) {
      whereClause.push(
        not(
          or(
            lt(SemesterD.endTerm, param.duration.startTerm),
            gt(SemesterD.startTerm, param.duration.endTerm),
          ),
        ),
      );
    }
    const result = await tx
      .select()
      .from(SemesterD)
      .where(and(...whereClause));

    return result.map(MSemester.fromDBResult);
  }

  async find(param: ISemesterQuery): Promise<MSemester[]> {
    return this.withTransaction(tx => this.findTx(tx, param));
  }
}
