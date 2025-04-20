import { HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { and, count, eq, inArray, isNull, SQL } from "drizzle-orm";
import { MySql2Database } from "drizzle-orm/mysql2";

import {
  INoticeCreate,
  INoticeUpdate,
} from "@clubs/interface/api/notice/type/notice.type";

import { getKSTDate } from "@sparcs-clubs/api/common/util/util";
import {
  DrizzleAsyncProvider,
  DrizzleTransaction,
} from "@sparcs-clubs/api/drizzle/drizzle.provider";
import { Notice } from "@sparcs-clubs/api/drizzle/schema/notice.schema";
import {
  INoticeOrderBy,
  MNotice,
} from "@sparcs-clubs/api/feature/notice/model/notice.model";

type INoticeQuery = {
  id?: number;
  ids?: number[];
  title?: string;
  author?: string;
  pagination?: {
    offset: number;
    itemCount: number;
  };
  orderBy?: INoticeOrderBy;
};

@Injectable()
export class NoticeRepository {
  @Inject(DrizzleAsyncProvider) private db: MySql2Database;
  constructor() {}

  async withTransaction<Result>(
    callback: (tx: DrizzleTransaction) => Promise<Result>,
  ): Promise<Result> {
    return this.db.transaction(callback);
  }

  private makeWhereClause(param: INoticeQuery): SQL[] {
    const whereClause: SQL[] = [];
    if (param.id) {
      whereClause.push(eq(Notice.id, param.id));
    }
    if (param.ids) {
      whereClause.push(inArray(Notice.id, param.ids));
    }
    if (param.title) {
      whereClause.push(eq(Notice.title, param.title));
    }
    if (param.author) {
      whereClause.push(eq(Notice.author, param.author));
    }
    whereClause.push(isNull(Notice.deletedAt));

    return whereClause;
  }

  async countTx(tx: DrizzleTransaction, param: INoticeQuery): Promise<number> {
    const [result] = await tx
      .select({ count: count() })
      .from(Notice)
      .where(and(...this.makeWhereClause(param)));

    return result.count;
  }

  async count(param: INoticeQuery): Promise<number> {
    return this.withTransaction(async tx => this.countTx(tx, param));
  }

  async findTx(
    tx: DrizzleTransaction,
    param: INoticeQuery,
  ): Promise<MNotice[]> {
    let query = tx
      .select()
      .from(Notice)
      .where(and(...this.makeWhereClause(param)))
      .$dynamic();

    if (param.pagination) {
      query = query.limit(param.pagination.itemCount);
      query = query.offset(
        (param.pagination.offset - 1) * param.pagination.itemCount,
      );
    }
    if (param.orderBy) {
      query = query.orderBy(...MNotice.makeOrderBy(param.orderBy));
    }

    const result = await query.execute();

    return result.map(row => MNotice.from(row));
  }

  async find(param: INoticeQuery): Promise<MNotice[]> {
    return this.withTransaction(async tx => this.findTx(tx, param));
  }

  async insertTx(tx: DrizzleTransaction, param: INoticeCreate): Promise<void> {
    const [result] = await tx.insert(Notice).values({ ...param });
    if (result.insertId === undefined) {
      throw new HttpException("Failed to insert", HttpStatus.BAD_REQUEST);
    }
  }

  async insert(param: INoticeCreate): Promise<void> {
    await this.withTransaction(async tx => this.insertTx(tx, param));
  }

  async updateTx(tx: DrizzleTransaction, param: INoticeUpdate): Promise<void> {
    const [result] = await tx
      .update(Notice)
      .set({ id: param.id })
      .where(and(eq(Notice.id, param.id), isNull(Notice.deletedAt)));
    if (result.affectedRows === 0) {
      throw new HttpException("Failed to update", HttpStatus.BAD_REQUEST);
    }
  }
  async update(param: INoticeUpdate): Promise<void> {
    await this.withTransaction(async tx => this.updateTx(tx, param));
  }

  async deleteTx(tx: DrizzleTransaction, id: number): Promise<void> {
    const cur = getKSTDate();
    const [result] = await tx
      .update(Notice)
      .set({ deletedAt: cur })
      .where(and(eq(Notice.id, id), isNull(Notice.deletedAt)));
    if (result.affectedRows === 0) {
      throw new HttpException("Failed to delete", HttpStatus.BAD_REQUEST);
    }
  }
}
