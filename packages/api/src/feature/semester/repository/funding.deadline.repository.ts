import { Inject, Injectable } from "@nestjs/common";
import { and, eq, gte, inArray, isNull, lte, SQL } from "drizzle-orm";
import { MySql2Database } from "drizzle-orm/mysql2";
import {
  DrizzleAsyncProvider,
  DrizzleTransaction,
} from "src/drizzle/drizzle.provider";
import { FundingDeadlineD } from "src/drizzle/schema/semester.schema";

import {
  IFundingDeadlineOrderBy,
  MFundingDeadline,
} from "../model/funding.deadline.model";

interface IFundingDeadlineQuery {
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
  orderBy?: IFundingDeadlineOrderBy;
}

@Injectable()
export class FundingDeadlineRepository {
  constructor(@Inject(DrizzleAsyncProvider) private db: MySql2Database) {}

  async findTx(
    tx: DrizzleTransaction,
    param: IFundingDeadlineQuery,
  ): Promise<MFundingDeadline[]> {
    const whereClause: SQL[] = [isNull(FundingDeadlineD.deletedAt)];

    if (param.id) {
      whereClause.push(eq(FundingDeadlineD.id, param.id));
    }
    if (param.ids) {
      whereClause.push(inArray(FundingDeadlineD.id, param.ids));
    }
    if (param.date) {
      whereClause.push(eq(FundingDeadlineD.startDate, param.date));
    }
    if (param.duration) {
      whereClause.push(
        and(
          gte(FundingDeadlineD.startDate, param.duration.startTerm),
          lte(FundingDeadlineD.endDate, param.duration.endTerm),
        ),
      );
    }

    let query = tx
      .select()
      .from(FundingDeadlineD)
      .where(and(...whereClause))
      .$dynamic();

    if (param.pagination) {
      query = query.limit(param.pagination.itemCount);
      query = query.offset(
        (param.pagination.offset - 1) * param.pagination.itemCount,
      );
    }

    if (param.orderBy) {
      query = query.orderBy(...MFundingDeadline.makeOrderBy(param.orderBy));
    }

    const result = await query.execute();

    return result.map(e => MFundingDeadline.from(e));
  }

  async find(param: IFundingDeadlineQuery): Promise<MFundingDeadline[]> {
    return this.db.transaction(tx => this.findTx(tx, param));
  }
}
