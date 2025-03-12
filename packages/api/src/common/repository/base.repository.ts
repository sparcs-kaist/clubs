import { Inject, Injectable } from "@nestjs/common";
import {
  and,
  asc,
  ColumnBaseConfig,
  ColumnDataType,
  desc,
  eq,
  gt,
  gte,
  inArray,
  isNotNull,
  isNull,
  like,
  lt,
  lte,
  ne,
  SQL,
} from "drizzle-orm";
import { MySqlColumn, MySqlTable } from "drizzle-orm/mysql-core";
import { MySql2Database } from "drizzle-orm/mysql2";

import {
  DrizzleAsyncProvider,
  DrizzleTransaction,
} from "@sparcs-clubs/api/drizzle/drizzle.provider";

import { MEntity } from "../model/entity.model";
import {
  FilterCondition,
  FilterValue,
  QueryOptions,
  SortCondition,
} from "../model/query.model";
import { getKSTDate, takeNotNull } from "../util/util";

interface TableWithId {
  id: MySqlColumn<ColumnBaseConfig<ColumnDataType, string>>;
}

interface ModelWithFrom<I, T extends MEntity<I>, D> {
  from(result: D): T;
}

@Injectable()
export abstract class BaseRepository<
  M extends MEntity<I>,
  R,
  D,
  T extends MySqlTable & TableWithId,
  I,
> {
  @Inject(DrizzleAsyncProvider) private db: MySql2Database;

  constructor(
    protected table: T,
    protected modelClass: ModelWithFrom<I, M, D>,
  ) {}

  async withTransaction<Result>(
    callback: (tx: DrizzleTransaction) => Promise<Result>,
  ): Promise<Result> {
    return this.db.transaction(callback);
  }

  async findTx(tx: DrizzleTransaction, id: I): Promise<M | null> {
    const result = await tx
      .select()
      .from(this.table)
      .where(eq(this.table.id, id))
      .then(rows => rows.map(row => this.modelClass.from(row as D)));

    return (result[0] as M) ?? null;
  }

  async find(id: I): Promise<M | null> {
    return this.withTransaction(async tx => this.findTx(tx, id));
  }

  async findAllTx(tx: DrizzleTransaction, ids: I[]): Promise<M[]> {
    if (ids.length === 0) {
      return [];
    }

    const result = await tx
      .select()
      .from(this.table)
      .where(inArray(this.table.id, ids));

    return result.map(row => this.modelClass.from(row as D));
  }

  async findAll(ids: I[]): Promise<M[]> {
    return this.withTransaction(async tx => this.findAllTx(tx, ids));
  }

  async insertTx(tx: DrizzleTransaction, param: R): Promise<M> {
    const [result] = await tx.insert(this.table).values(param).execute();

    const newId = result.insertId as I;

    return this.findTx(tx, newId).then(takeNotNull());
  }

  async insert(param: R): Promise<M> {
    return this.withTransaction(async tx => this.insertTx(tx, param));
  }

  async putTx(tx: DrizzleTransaction, id: I, param: R): Promise<M> {
    await tx
      .update(this.table)
      .set(param)
      .where(eq(this.table.id, id))
      .execute();
    return this.findTx(tx, id).then(takeNotNull());
  }

  async put(id: I, param: R): Promise<M> {
    return this.withTransaction(async tx => this.putTx(tx, id, param));
  }

  async patchTx(
    tx: DrizzleTransaction,
    oldbie: M,
    consumer: (oldbie: M) => M, // eslint-disable-line no-shadow
  ): Promise<M> {
    const param = consumer(oldbie);
    await tx
      .update(this.table)
      .set(param)
      .where(eq(this.table.id, oldbie.id))
      .execute();

    return this.findTx(tx, oldbie.id).then(takeNotNull());
  }

  // eslint-disable-next-line no-shadow
  async patch(oldbie: M, consumer: (oldbie: M) => M): Promise<M> {
    return this.withTransaction(async tx => this.patchTx(tx, oldbie, consumer));
  }

  async deleteTx(tx: DrizzleTransaction, id: number | string): Promise<void> {
    await tx
      .update(this.table)
      .set({ deletedAt: getKSTDate() })
      .where(eq(this.table.id, id))
      .execute();
  }

  async delete(id: number | string): Promise<void> {
    return this.withTransaction(async tx => this.deleteTx(tx, id));
  }

  /**
   * 트랜잭션 내에서 쿼리 옵션으로 데이터를 조회하는 메서드
   */
  async queryTx(
    tx: DrizzleTransaction,
    options: QueryOptions<D>,
  ): Promise<M[]> {
    return this.executeQuery(tx, options);
  }

  /**
   * 쿼리 옵션으로 데이터를 조회하는 메서드
   */
  async query(options: QueryOptions<D>): Promise<M[]> {
    return this.withTransaction(tx => this.queryTx(tx, options));
  }

  /**
   * 필터 조건을 SQL 조건으로 변환하는 헬퍼 메서드
   */
  protected filterToSql(table: T, filter: FilterCondition<D>): SQL {
    const column = table[filter.field as string];

    switch (filter.operator) {
      case "eq":
        return eq(column, filter.value as FilterValue);
      case "neq":
        return ne(column, filter.value as FilterValue);
      case "gt":
        return gt(column, filter.value as FilterValue);
      case "gte":
        return gte(column, filter.value as FilterValue);
      case "lt":
        return lt(column, filter.value as FilterValue);
      case "lte":
        return lte(column, filter.value as FilterValue);
      case "in":
        if (!Array.isArray(filter.value)) {
          throw new Error("'in' 연산자에는 배열 값이 필요합니다");
        }
        return inArray(
          column,
          filter.value as Array<string | number | boolean | Date>,
        );
      case "like":
        return like(column, `%${filter.value as string}%`);
      case "isNull":
        return isNull(column);
      case "isNotNull":
        return isNotNull(column);
      default:
        throw new Error(`지원하지 않는 연산자입니다: ${filter.operator}`);
    }
  }

  /**
   * 정렬 조건을 SQL 조건으로 변환하는 헬퍼 메서드
   */
  protected sortToSql(table: T, sort: SortCondition<D>): SQL {
    const column = table[sort.field as string];
    return sort.order === "asc" ? asc(column) : desc(column);
  }

  /**
   * 쿼리 옵션을 받아 실제 쿼리를 실행하는 헬퍼 메서드
   */
  protected async executeQuery(
    tx: DrizzleTransaction,
    options: QueryOptions<D>,
  ): Promise<M[]> {
    let query = tx.select().from(this.table);

    if (options.filters && options.filters.length > 0) {
      const conditions = options.filters.map(filter =>
        this.filterToSql(this.table, filter),
      );
      // @ts-expect-error - Drizzle ORM 타입 이슈
      query = query.where(and(...conditions));
    }

    if (options.sort && options.sort.length > 0) {
      const sortConditions = options.sort.map(sort =>
        this.sortToSql(this.table, sort),
      );
      // @ts-expect-error - Drizzle ORM 타입 이슈
      query = query.orderBy(...sortConditions);
    }

    if (options.limit) {
      // @ts-expect-error - Drizzle ORM 타입 이슈
      query = query.limit(options.limit);
    }

    if (options.offset) {
      // @ts-expect-error - Drizzle ORM 타입 이슈
      query = query.offset(options.offset);
    }

    const result = await query;
    return result.map(row => this.modelClass.from(row as D));
  }
}
