import { Inject, Injectable } from "@nestjs/common";
import {
  and,
  asc,
  ColumnBaseConfig,
  ColumnDataType,
  count,
  desc,
  eq,
  gt,
  gte,
  inArray,
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

import { OrderByTypeEnum } from "../enums";
import { MEntity } from "../model/entity.model";
import { getKSTDate, takeAll, takeOnlyOne } from "../util/util";

interface TableWithId {
  id: MySqlColumn<ColumnBaseConfig<ColumnDataType, string>>;
}

interface ModelWithFrom<
  Model extends MEntity<IdType>,
  DbResult,
  Query,
  IdType = number,
> {
  from(result: DbResult): Model;
  modelName: string;
  fieldMap(field: keyof Query): keyof DbResult;
}

export interface BaseQueryFields<IdType = number> {
  id?: IdType;
  ids?: IdType[];
  pagination?: {
    offset: number;
    itemCount: number;
  };
  order?: Record<string, OrderByTypeEnum>;
}

export type BaseRepositoryQuery<
  Query,
  IdType = number,
> = BaseQueryFields<IdType> & Partial<Query>;

@Injectable()
export abstract class BaseRepository<
  Model extends MEntity<IdType>,
  CreateParam,
  UpdateParam,
  DbResult,
  Table extends MySqlTable & TableWithId,
  Query,
  IdType = number,
> {
  @Inject(DrizzleAsyncProvider) private db: MySql2Database;

  constructor(
    protected table: Table,
    protected modelClass: ModelWithFrom<Model, DbResult, Query, IdType>,
  ) {}

  async withTransaction<Result>(
    callback: (tx: DrizzleTransaction) => Promise<Result>,
  ): Promise<Result> {
    return this.db.transaction(callback);
  }

  protected makeWhereClause(param: BaseRepositoryQuery<Query, IdType>): SQL[] {
    const whereClause: SQL[] = [];

    // 기본 필터링: id와 ids
    if (param.id) {
      whereClause.push(eq(this.table.id, param.id));
    }
    if (param.ids) {
      whereClause.push(inArray(this.table.id, param.ids));
    }

    // Query 타입의 모든 키를 순회하면서 파라미터에 해당 값이 있는지 확인
    const specialKeys = ["id", "ids", "pagination", "order"];
    Object.keys(param).forEach(key => {
      // 특별한 키는 제외
      if (specialKeys.includes(key)) {
        return; // continue 대신 return 사용
      }

      // 파라미터 값이 존재하는 경우
      const value = param[key];
      if (value !== undefined && value !== null) {
        // Query 필드를 테이블 필드로 변환
        const tableField = this.getTableField(key as keyof Query);
        if (!tableField || !this.table[tableField]) {
          throw new Error(`Invalid query field: ${key}`);
        }

        // 배열인 경우 IN 연산자 사용
        if (Array.isArray(value)) {
          whereClause.push(inArray(this.table[tableField], value));
        }
        // 객체인 경우 복합 조건 처리 (gt, lt, gte, lte 등)
        else if (typeof value === "object") {
          this.processAdvancedOperators(whereClause, key as keyof Query, value);
        }
        // 단일 값인 경우 = 연산자 사용
        else {
          whereClause.push(eq(this.table[tableField], value));
        }
      }
    });

    return whereClause;
  }

  // Query 필드를 테이블 필드로 변환하는 헬퍼 메서드
  private getTableField(queryField: keyof Query): string {
    const dbField = this.modelClass.fieldMap(queryField);
    return dbField as string;
  }

  // 고급 연산자 처리 (gt, lt, gte, lte, like 등)
  private processAdvancedOperators(
    whereClause: SQL[],
    queryField: keyof Query,
    conditions: Record<string, unknown>,
  ): void {
    // Query 필드를 테이블 필드로 변환
    const tableField = this.getTableField(queryField);
    if (!tableField || !this.table[tableField]) {
      return; // 테이블에 해당 필드가 없으면 처리하지 않음
    }

    // 객체의 키-값 쌍을 forEach로 순회
    Object.entries(conditions).forEach(([operator, operand]) => {
      if (operand === undefined || operand === null) {
        return; // 값이 없으면 건너뜀
      }

      switch (operator) {
        case "eq":
          whereClause.push(eq(this.table[tableField], operand));
          break;
        case "ne":
          whereClause.push(ne(this.table[tableField], operand));
          break;
        case "gt":
          whereClause.push(gt(this.table[tableField], operand));
          break;
        case "gte":
          whereClause.push(gte(this.table[tableField], operand));
          break;
        case "lt":
          whereClause.push(lt(this.table[tableField], operand));
          break;
        case "lte":
          whereClause.push(lte(this.table[tableField], operand));
          break;
        case "like":
          whereClause.push(
            like(this.table[tableField], `%${String(operand)}%`),
          );
          break;
        case "startsWith":
          whereClause.push(like(this.table[tableField], `${String(operand)}%`));
          break;
        case "endsWith":
          whereClause.push(like(this.table[tableField], `%${String(operand)}`));
          break;
        case "in":
          if (Array.isArray(operand)) {
            whereClause.push(inArray(this.table[tableField], operand));
          }
          break;
        default:
          // 지원하지 않는 연산자는 무시
          break;
      }
    });
  }

  // 여러 필드에 대한 정렬을 지원하는 구현
  protected makeOrderBy(order: Record<string, OrderByTypeEnum>): SQL[] {
    const orderClauses: SQL[] = [];

    // 객체의 키-값 쌍을 순회하며 정렬 조건 생성
    Object.entries(order).forEach(([field, direction]) => {
      // Query 필드를 테이블 필드로 변환
      const tableField = this.getTableField(field as keyof Query);
      // 테이블에 해당 필드가 존재하는지 확인
      if (tableField && this.table[tableField]) {
        // direction에 따라 asc() 또는 desc() 호출
        if (direction === OrderByTypeEnum.ASC) {
          orderClauses.push(asc(this.table[tableField]));
        } else {
          orderClauses.push(desc(this.table[tableField]));
        }
      } else {
        throw new Error(`Invalid order field: ${field}`);
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
    param: BaseRepositoryQuery<Query, IdType>,
  ): Promise<Model[]> {
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

    return result.map(row => this.modelClass.from(row as DbResult));
  }

  async find(param: BaseRepositoryQuery<Query, IdType>): Promise<Model[]> {
    return this.withTransaction(async tx => this.findTx(tx, param));
  }

  async fetchTx(tx: DrizzleTransaction, id: IdType): Promise<Model> {
    const param = { id } as unknown as BaseRepositoryQuery<Query, IdType>;
    return this.findTx(tx, param).then(
      takeOnlyOne<Model>(this.modelClass.modelName),
    );
  }

  async fetch(id: IdType): Promise<Model> {
    return this.withTransaction(async tx => this.fetchTx(tx, id));
  }

  async fetchAllTx(tx: DrizzleTransaction, ids: IdType[]): Promise<Model[]> {
    const param = { ids } as unknown as BaseRepositoryQuery<Query, IdType>;
    const result = await this.findTx(tx, param);
    // @ts-expect-error - IdType 제약 조건 문제는 런타임에는 영향이 없습니다
    return takeAll<Model & { id: IdType }, IdType>(
      ids,
      this.modelClass.modelName,
    )(result as (Model & { id: IdType })[]);
  }

  async fetchAll(ids: IdType[]): Promise<Model[]> {
    return this.withTransaction(async tx => this.fetchAllTx(tx, ids));
  }

  async countTx(
    tx: DrizzleTransaction,
    param: BaseRepositoryQuery<Query, IdType>,
  ): Promise<number> {
    const [result] = await tx
      .select({ count: count() })
      .from(this.table)
      .where(and(...this.makeWhereClause(param)));

    return result.count;
  }

  async count(param: BaseRepositoryQuery<Query, IdType>): Promise<number> {
    return this.withTransaction(async tx => this.countTx(tx, param));
  }

  async createTx(tx: DrizzleTransaction, param: CreateParam): Promise<Model> {
    const [result] = await tx.insert(this.table).values(param).execute();

    // insertId를 적절한 타입으로 변환
    const newId = this.convertToIdType(result.insertId);

    return this.fetchTx(tx, newId);
  }

  // insertId를 IdType으로 변환하는 헬퍼 메서드
  private convertToIdType(insertId: string | number): IdType {
    // IdType이 number인 경우
    if (typeof (0 as unknown as IdType) === "number") {
      return Number(insertId) as unknown as IdType;
    }
    // IdType이 string인 경우
    if (typeof ("" as unknown as IdType) === "string") {
      return String(insertId) as unknown as IdType;
    }
    // 기타 타입인 경우 (기본적으로 원본 값 반환)
    return insertId as unknown as IdType;
  }

  async create(param: CreateParam): Promise<Model> {
    return this.withTransaction(async tx => this.createTx(tx, param));
  }

  async putTx(
    tx: DrizzleTransaction,
    id: IdType,
    param: UpdateParam,
  ): Promise<Model> {
    await tx
      .update(this.table)
      .set(param)
      .where(eq(this.table.id, id))
      .execute();

    return this.fetchTx(tx, id);
  }

  async put(id: IdType, param: UpdateParam): Promise<Model> {
    return this.withTransaction(async tx => this.putTx(tx, id, param));
  }

  async patchTx(
    tx: DrizzleTransaction,
    oldbie: Model,
    consumer: (oldbie: Model) => Model, // eslint-disable-line no-shadow
  ): Promise<Model> {
    const param = consumer(oldbie);
    await tx
      .update(this.table)
      .set(param)
      .where(eq(this.table.id, oldbie.id))
      .execute();

    return this.fetchTx(tx, oldbie.id);
  }

  async patch(
    oldbie: Model,
    consumer: (oldbie: Model) => Model, // eslint-disable-line no-shadow
  ): Promise<Model> {
    return this.withTransaction(async tx => this.patchTx(tx, oldbie, consumer));
  }

  async deleteTx(tx: DrizzleTransaction, id: IdType): Promise<void> {
    await tx
      .update(this.table)
      .set({ deletedAt: getKSTDate() })
      .where(eq(this.table.id, id))
      .execute();
  }

  async delete(id: IdType): Promise<void> {
    return this.withTransaction(async tx => this.deleteTx(tx, id));
  }
}
