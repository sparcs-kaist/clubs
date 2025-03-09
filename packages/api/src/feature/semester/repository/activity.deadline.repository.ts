import { Inject, Injectable } from "@nestjs/common";
import { and, eq, gte, inArray, isNull, lte, SQL } from "drizzle-orm";
import { MySql2Database } from "drizzle-orm/mysql2";
import {
  DrizzleAsyncProvider,
  DrizzleTransaction,
} from "src/drizzle/drizzle.provider";
import { ActivityDeadlineD } from "src/drizzle/schema/semester.schema";

import {
  IActivityDeadlineOrderBy,
  MActivityDeadline,
} from "../model/activity.deadline.model";

interface IActivityDeadlineQuery {
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
  orderBy?: IActivityDeadlineOrderBy;
}

@Injectable()
export class ActivityDeadlineRepository {
  constructor(@Inject(DrizzleAsyncProvider) private db: MySql2Database) {}

  async findTx(
    tx: DrizzleTransaction,
    param: IActivityDeadlineQuery,
  ): Promise<MActivityDeadline[]> {
    const whereClause: SQL[] = [isNull(ActivityDeadlineD.deletedAt)];

    if (param.id) {
      whereClause.push(eq(ActivityDeadlineD.id, param.id));
    }
    if (param.ids) {
      whereClause.push(inArray(ActivityDeadlineD.id, param.ids));
    }
    if (param.date) {
      whereClause.push(eq(ActivityDeadlineD.startDate, param.date));
    }
    if (param.duration) {
      whereClause.push(
        and(
          gte(ActivityDeadlineD.startDate, param.duration.startTerm),
          lte(ActivityDeadlineD.endDate, param.duration.endTerm),
        ),
      );
    }

    let query = tx
      .select()
      .from(ActivityDeadlineD)
      .where(and(...whereClause))
      .$dynamic();

    if (param.pagination) {
      query = query.limit(param.pagination.itemCount);
      query = query.offset(
        (param.pagination.offset - 1) * param.pagination.itemCount,
      );
    }

    if (param.orderBy) {
      query = query.orderBy(...MActivityDeadline.makeOrderBy(param.orderBy));
    }

    const result = await query.execute();

    return result.map(e => MActivityDeadline.from(e));
  }

  async find(param: IActivityDeadlineQuery): Promise<MActivityDeadline[]> {
    return this.db.transaction(tx => this.findTx(tx, param));
  }
}
