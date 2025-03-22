import { Inject, Injectable } from "@nestjs/common";
import {
  and,
  asc,
  ColumnBaseConfig,
  ColumnDataType,
  count,
  desc,
  eq,
  inArray,
  SQL,
} from "drizzle-orm";
import { MySqlColumn, MySqlTable } from "drizzle-orm/mysql-core";
import { MySql2Database } from "drizzle-orm/mysql2";

import {
  DrizzleAsyncProvider,
  DrizzleTransaction,
} from "@sparcs-clubs/api/drizzle/drizzle.provider";

import { OrderByTypeEnum } from "../enums";
import { MEntity } from "../model/entity.model";
import { getKSTDate, takeOnlyOne } from "../util/util";

interface TableWithId {
  id: MySqlColumn<ColumnBaseConfig<ColumnDataType, string>>;
}

interface ModelWithFrom<M extends MEntity, D> {
  from(result: D): M;
  tableName: string;
}

export interface BaseQueryFields {
  id?: number;
  ids?: number[];
  pagination?: {
    offset: number;
    itemCount: number;
  };
  order?: Record<string, OrderByTypeEnum>;
}

// D 타입에서 파생된 쿼리 타입 (D 타입의 모든 필드를 선택적으로 포함)
export type BaseRepositoryQuery<D> = BaseQueryFields & Partial<D>;

@Injectable()
export abstract class BaseRepository<
  M extends MEntity,
  R,
  D,
  T extends MySqlTable & TableWithId,
> {
  @Inject(DrizzleAsyncProvider) private db: MySql2Database;

  constructor(
    protected table: T,
    protected modelClass: ModelWithFrom<M, D>,
  ) {}

  async withTransaction<Result>(
    callback: (tx: DrizzleTransaction) => Promise<Result>,
  ): Promise<Result> {
    return this.db.transaction(callback);
  }

  protected makeWhereClause(param: BaseRepositoryQuery<D>): SQL[] {
    const whereClause: SQL[] = [];

    // 기본 필터링: id와 ids
    if (param.id) {
      whereClause.push(eq(this.table.id, param.id));
    }
    if (param.ids) {
      whereClause.push(inArray(this.table.id, param.ids));
    }

    // 테이블의 모든 필드에 대해 필터링 적용
    // D 타입의 모든 키를 순회하면서 파라미터에 해당 값이 있는지 확인
    const specialKeys = ["id", "ids", "pagination", "order"];
    Object.keys(param).forEach(key => {
      // 특별한 키는 제외
      if (specialKeys.includes(key)) {
        return; // continue 대신 return 사용
      }

      // 파라미터 값이 존재하고 테이블에 해당 컬럼이 있는 경우
      const value = param[key];
      if (value !== undefined && value !== null && this.table[key]) {
        // 배열인 경우 IN 연산자 사용
        if (Array.isArray(value)) {
          whereClause.push(inArray(this.table[key], value));
        }
        // 단일 값인 경우 = 연산자 사용
        else {
          whereClause.push(eq(this.table[key], value));
        }
      }
    });

    return whereClause;
  }

  // 여러 필드에 대한 정렬을 지원하는 구현
  protected makeOrderBy(order: Record<string, OrderByTypeEnum>): SQL[] {
    const orderClauses: SQL[] = [];

    // 객체의 키-값 쌍을 순회하며 정렬 조건 생성
    Object.entries(order).forEach(([field, direction]) => {
      // 테이블에 해당 필드가 존재하는지 확인
      if (this.table[field]) {
        // direction에 따라 asc() 또는 desc() 호출
        if (direction === OrderByTypeEnum.ASC) {
          orderClauses.push(asc(this.table[field]));
        } else {
          orderClauses.push(desc(this.table[field]));
        }
      }
    });

    // 정렬 조건이 없으면 기본적으로 ID로 오름차순 정렬
    if (orderClauses.length === 0) {
      orderClauses.push(asc(this.table.id));
    }

    return orderClauses;
  }

  async findTx(
    tx: DrizzleTransaction,
    param: BaseRepositoryQuery<D>,
  ): Promise<M[]> {
    let query = tx
      .select()
      .from(this.table)
      .where(and(...this.makeWhereClause(param)))
      .$dynamic();

    if (param.pagination) {
      query = query.limit(param.pagination.itemCount);
      query = query.offset(
        (param.pagination.offset - 1) * param.pagination.itemCount,
      );
    }

    if (param.order) {
      query = query.orderBy(...this.makeOrderBy(param.order));
    }

    const result = await query.execute();

    return result.map(row => this.modelClass.from(row as D));
  }

  async countTx(
    tx: DrizzleTransaction,
    param: BaseRepositoryQuery<D>,
  ): Promise<number> {
    const [result] = await tx
      .select({ count: count() })
      .from(this.table)
      .where(and(...this.makeWhereClause(param)));

    return result.count;
  }

  async count(param: BaseRepositoryQuery<D>): Promise<number> {
    return this.withTransaction(async tx => this.countTx(tx, param));
  }

  async find(param: BaseRepositoryQuery<D>): Promise<M[]> {
    return this.withTransaction(async tx => this.findTx(tx, param));
  }

  async insertTx(tx: DrizzleTransaction, param: R): Promise<M> {
    const [result] = await tx.insert(this.table).values(param).execute();

    const newId = Number(result.insertId);

    return this.findTx(tx, { id: newId } as BaseRepositoryQuery<D>).then(
      takeOnlyOne(this.modelClass.tableName),
    );
  }

  async insert(param: R): Promise<M> {
    return this.withTransaction(async tx => this.insertTx(tx, param));
  }

  async putTx(tx: DrizzleTransaction, id: number, param: R): Promise<M> {
    await tx
      .update(this.table)
      .set(param)
      .where(eq(this.table.id, id))
      .execute();
    return this.findTx(tx, { id } as BaseRepositoryQuery<D>).then(
      takeOnlyOne(this.modelClass.tableName),
    );
  }

  async put(id: number, param: R): Promise<M> {
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

    return this.findTx(tx, { id: oldbie.id } as BaseRepositoryQuery<D>).then(
      takeOnlyOne(this.modelClass.tableName),
    );
  }

  // eslint-disable-next-line no-shadow
  async patch(oldbie: M, consumer: (oldbie: M) => M): Promise<M> {
    return this.withTransaction(async tx => this.patchTx(tx, oldbie, consumer));
  }

  async deleteTx(tx: DrizzleTransaction, id: number): Promise<void> {
    await tx
      .update(this.table)
      .set({ deletedAt: getKSTDate() })
      .where(eq(this.table.id, id))
      .execute();
  }

  async delete(id: number): Promise<void> {
    return this.withTransaction(async tx => this.deleteTx(tx, id));
  }
}
