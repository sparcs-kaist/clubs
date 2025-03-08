import { Inject, Injectable } from "@nestjs/common";
import { and, eq, gt, gte, isNull, lt, lte, not, or, SQL } from "drizzle-orm";
import { MySql2Database } from "drizzle-orm/mysql2";

import {
  DrizzleAsyncProvider,
  DrizzleTransaction,
} from "@sparcs-clubs/api/drizzle/drizzle.provider";
import { SemesterD } from "@sparcs-clubs/api/drizzle/schema/semester.schema";

import { ISemesterOrderBy, MSemester } from "../model/semester.model";

interface ISemesterQuery {
  id?: number;
  date?: Date;
  duration?: {
    startTerm: Date;
    endTerm: Date;
  };
  pagination?: {
    offset?: number;
    itemCount?: number;
  };
  orderBy?: ISemesterOrderBy;
}

@Injectable()
export default class SemesterRepository {
  constructor(@Inject(DrizzleAsyncProvider) private db: MySql2Database) {}

  async withTransaction<T>(
    callback: (tx: DrizzleTransaction) => Promise<T>,
  ): Promise<T> {
    return this.db.transaction(callback);
  }

  async findTx(
    tx: DrizzleTransaction,
    param: ISemesterQuery,
  ): Promise<MSemester[]> {
    const whereClause: SQL[] = [isNull(SemesterD.deletedAt)];

    if (param.id) {
      whereClause.push(eq(SemesterD.id, param.id));
    }
    if (param.date) {
      whereClause.push(
        and(
          lte(SemesterD.startTerm, param.date),
          gte(SemesterD.endTerm, param.date),
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

    let query = tx
      .select()
      .from(SemesterD)
      .where(and(...whereClause))
      .$dynamic();

    if (param.pagination) {
      query = query.limit(param.pagination.itemCount);
      query = query.offset(
        (param.pagination.offset - 1) * param.pagination.itemCount,
      );
    }

    if (param.orderBy) {
      query = query.orderBy(...MSemester.makeOrderBy(param.orderBy));
    }

    const result = await query.execute();

    return result.map(e => MSemester.fromDBResult(e));
  }

  async find(param: ISemesterQuery): Promise<MSemester[]> {
    return this.withTransaction(tx => this.findTx(tx, param));
  }
}
