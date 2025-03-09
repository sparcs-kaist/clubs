import { Inject, Injectable } from "@nestjs/common";
import { and, eq, gte, inArray, isNull, lte, SQL } from "drizzle-orm";
import { MySql2Database } from "drizzle-orm/mysql2";
import {
  DrizzleAsyncProvider,
  DrizzleTransaction,
} from "src/drizzle/drizzle.provider";
import { RegistrationDeadlineD } from "src/drizzle/schema/semester.schema";

import {
  IRegistrationDeadlineOrderBy,
  MRegistrationDeadline,
} from "../model/registration.deadline.model";

interface IRegistrationDeadlineQuery {
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
  orderBy?: IRegistrationDeadlineOrderBy;
}

@Injectable()
export class RegistrationDeadlineRepository {
  constructor(@Inject(DrizzleAsyncProvider) private db: MySql2Database) {}

  async findTx(
    tx: DrizzleTransaction,
    param: IRegistrationDeadlineQuery,
  ): Promise<MRegistrationDeadline[]> {
    const whereClause: SQL[] = [isNull(RegistrationDeadlineD.deletedAt)];

    if (param.id) {
      whereClause.push(eq(RegistrationDeadlineD.id, param.id));
    }
    if (param.ids) {
      whereClause.push(inArray(RegistrationDeadlineD.id, param.ids));
    }
    if (param.date) {
      whereClause.push(eq(RegistrationDeadlineD.startDate, param.date));
    }
    if (param.duration) {
      whereClause.push(
        and(
          gte(RegistrationDeadlineD.startDate, param.duration.startTerm),
          lte(RegistrationDeadlineD.endDate, param.duration.endTerm),
        ),
      );
    }

    let query = tx
      .select()
      .from(RegistrationDeadlineD)
      .where(and(...whereClause))
      .$dynamic();

    if (param.pagination) {
      query = query.limit(param.pagination.itemCount);
      query = query.offset(
        (param.pagination.offset - 1) * param.pagination.itemCount,
      );
    }

    if (param.orderBy) {
      query = query.orderBy(
        ...MRegistrationDeadline.makeOrderBy(param.orderBy),
      );
    }

    const result = await query.execute();

    return result.map(e => MRegistrationDeadline.from(e));
  }

  async find(
    param: IRegistrationDeadlineQuery,
  ): Promise<MRegistrationDeadline[]> {
    return this.db.transaction(tx => this.findTx(tx, param));
  }
}
