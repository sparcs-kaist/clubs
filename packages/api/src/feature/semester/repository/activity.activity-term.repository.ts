import { Inject, Injectable } from "@nestjs/common";
import {
  and,
  eq,
  gt,
  gte,
  inArray,
  isNull,
  lt,
  lte,
  not,
  or,
  SQL,
} from "drizzle-orm";
import { MySql2Database } from "drizzle-orm/mysql2";

import {
  DrizzleAsyncProvider,
  DrizzleTransaction,
} from "@sparcs-clubs/api/drizzle/drizzle.provider";
import { ActivityD } from "@sparcs-clubs/api/drizzle/schema/semester.schema";

import {
  IActivityDurationOrderBy,
  MActivityDuration,
} from "../model/activity.duration.model";

interface IActivityDurationQuery {
  id?: number;
  ids?: number[];
  date?: Date;
  duration?: {
    startTerm: Date;
    endTerm: Date;
  };
  pagination?: {
    offset?: number;
    itemCount?: number;
  };
  orderBy?: IActivityDurationOrderBy;
}

@Injectable()
export class ActivityDurationRepository {
  constructor(@Inject(DrizzleAsyncProvider) private db: MySql2Database) {}

  async withTransaction<T>(
    callback: (tx: DrizzleTransaction) => Promise<T>,
  ): Promise<T> {
    return this.db.transaction(callback);
  }

  async findTx(
    tx: DrizzleTransaction,
    param: IActivityDurationQuery,
  ): Promise<MActivityDuration[]> {
    const whereClause: SQL[] = [isNull(ActivityD.deletedAt)];

    if (param.id) {
      whereClause.push(eq(ActivityD.id, param.id));
    }
    if (param.ids) {
      whereClause.push(inArray(ActivityD.id, param.ids));
    }
    if (param.date) {
      whereClause.push(
        and(
          lte(ActivityD.startTerm, param.date),
          gte(ActivityD.endTerm, param.date),
        ),
      );
    }
    if (param.duration) {
      whereClause.push(
        not(
          or(
            lt(ActivityD.endTerm, param.duration.startTerm),
            gt(ActivityD.startTerm, param.duration.endTerm),
          ),
        ),
      );
    }

    let query = tx
      .select()
      .from(ActivityD)
      .where(and(...whereClause))
      .$dynamic();

    if (param.pagination) {
      query = query.limit(param.pagination.itemCount);
      query = query.offset(
        (param.pagination.offset - 1) * param.pagination.itemCount,
      );
    }

    if (param.orderBy) {
      query = query.orderBy(...MActivityDuration.makeOrderBy(param.orderBy));
    }

    const result = await query.execute();

    return result.map(e => MActivityDuration.from(e));
  }

  async find(param: IActivityDurationQuery): Promise<MActivityDuration[]> {
    return this.withTransaction(tx => this.findTx(tx, param));
  }
}
