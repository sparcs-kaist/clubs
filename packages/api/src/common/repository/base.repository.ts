import { Inject, Injectable } from "@nestjs/common";
import {
  and,
  ColumnBaseConfig,
  ColumnDataType,
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
import logger from "../util/logger";
import { getKSTDate, takeOnlyOne } from "../util/util";

interface TableWithId {
  id: MySqlColumn<ColumnBaseConfig<ColumnDataType, string>>;
}

interface ModelWithFrom<I, T extends MEntity<I>, D> {
  from(result: D): T;
}

// 필터 연산자 타입 정의
export type FilterOperator =
  | "eq"
  | "neq"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "in"
  | "like"
  | "isNull"
  | "isNotNull";

// 기본 필터 옵션 타입 정의
export interface FilterOption<T> {
  operator?: FilterOperator; // operator 생략시 기본값 'eq'로 처리
  value: T;
}

// 필드별 필터 조건 타입
export type FieldFilters<D> = Partial<{
  [K in keyof D]: FilterOption<D[K]> | D[K];
}>;

// 통합된 쿼리 인터페이스 정의
export interface IBaseQuery<I, D> {
  id?: I;
  ids?: I[];
  pagination?: {
    offset: number;
    itemCount: number;
  };
  orderBy?: Record<string, string>;
  filters?: FieldFilters<D>;
}

// 컬럼 타입 정의 (MySql 전용 컬럼 타입 사용)
type MySqlColumnType = MySqlColumn<ColumnBaseConfig<ColumnDataType, string>>;

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

  async findTx(tx: DrizzleTransaction, query?: IBaseQuery<I, D>): Promise<M[]> {
    if (!query) {
      return [];
    }

    // 쿼리 조건 구성
    const whereClause: SQL[] = [];

    // 기본 필드 처리 (id, ids)
    if (query.id) {
      whereClause.push(eq(this.table.id, query.id));
    }
    if (query.ids && query.ids.length > 0) {
      whereClause.push(inArray(this.table.id, query.ids));
    }

    // 필터 처리
    if (query.filters) {
      this.processFilters(query.filters, whereClause);
    }

    // 소프트 삭제 처리 (deletedAt 필드가 있는 경우)
    if ("deletedAt" in this.table) {
      this.handleSoftDelete(whereClause);
    }

    // 기본 쿼리 구성 및 where 조건 추가
    let queryBuilder = tx
      .select()
      .from(this.table)
      .where(and(...whereClause))
      .$dynamic();

    // 페이지네이션 추가
    if (query.pagination) {
      queryBuilder = queryBuilder.limit(query.pagination.itemCount);
      queryBuilder = queryBuilder.offset(
        (query.pagination.offset - 1) * query.pagination.itemCount,
      );
    }

    // 정렬 조건 추가
    if (query.orderBy) {
      const orderByResult = this.generateOrderBy(query.orderBy);
      if (orderByResult.length > 0) {
        queryBuilder = queryBuilder.orderBy(...(orderByResult as SQL[]));
      }
    }

    // 쿼리 실행 및 결과 변환
    const result = await queryBuilder.execute();
    return result.map(row => this.modelClass.from(row as D));
  }

  /**
   * 필터를 처리하는 헬퍼 메서드
   */
  private processFilters(filters: FieldFilters<D>, whereClause: SQL[]): void {
    Object.entries(filters).forEach(([key, filter]) => {
      // 테이블에 해당 필드가 있는지 확인
      if (key in this.table) {
        if (filter === null || filter === undefined) {
          return;
        }

        try {
          // 테이블 컬럼 가져오기
          const column = this.getColumn(key);

          // FilterOption 타입인지 또는 기본 값인지 확인
          if (
            typeof filter === "object" &&
            filter !== null &&
            "value" in filter
          ) {
            // FilterOption 객체인 경우
            const { operator = "eq", value } = filter as FilterOption<unknown>;
            this.applyOperator(operator, column, value, whereClause);
          } else {
            // 기본 값인 경우 (eq 연산자로 처리)
            whereClause.push(eq(column, filter));
          }
        } catch (error) {
          // 컬럼 접근 오류시 무시
          logger.error(`Column access error for ${key}:`, error);
        }
      }
    });
  }

  /**
   * 연산자를 적용하는 헬퍼 메서드
   */
  private applyOperator(
    operator: FilterOperator,
    column: MySqlColumnType,
    value: unknown,
    whereClause: SQL[],
  ): void {
    switch (operator) {
      case "eq":
        whereClause.push(eq(column, value));
        break;
      case "neq":
        whereClause.push(ne(column, value));
        break;
      case "gt":
        whereClause.push(gt(column, value));
        break;
      case "gte":
        whereClause.push(gte(column, value));
        break;
      case "lt":
        whereClause.push(lt(column, value));
        break;
      case "lte":
        whereClause.push(lte(column, value));
        break;
      case "in":
        if (Array.isArray(value)) {
          whereClause.push(inArray(column, value));
        }
        break;
      case "like":
        if (typeof value === "string") {
          whereClause.push(like(column, `%${value}%`));
        }
        break;
      case "isNull":
        whereClause.push(isNull(column));
        break;
      case "isNotNull":
        whereClause.push(isNotNull(column));
        break;
      default:
        break;
    }
  }

  /**
   * 소프트 삭제 처리를 위한 헬퍼 메서드
   */
  private handleSoftDelete(whereClause: SQL[]): void {
    try {
      // deletedAt 컬럼 가져오기
      const deletedAtColumn = this.getColumn("deletedAt");
      whereClause.push(isNull(deletedAtColumn));
    } catch (error) {
      // 컬럼 접근 오류시 무시
      logger.error("DeletedAt column access error:", error);
    }
  }

  /**
   * 특정 이름의 컬럼을 가져오는 헬퍼 메서드
   */
  private getColumn(key: string): MySqlColumnType {
    // 컬럼 타입 캐스팅 - 안전하게 처리
    if (key in this.table) {
      // TypeScript 타입 체커를 우회하기 위해 인덱싱을 사용
      return this.table[key as keyof T] as MySqlColumnType;
    }
    throw new Error(`Column ${key} not found in table`);
  }

  /**
   * 정렬 조건을 생성하는 메서드
   * 상속받는 클래스에서 오버라이드 가능
   */
  protected generateOrderBy(_orderBy: Record<string, string>): SQL[] {
    // 기본 구현에서는 빈 배열 반환
    // 상속 클래스에서 구체적인 구현을 제공해야 함
    return [];
  }

  async find(query?: IBaseQuery<I, D>): Promise<M[]> {
    return this.withTransaction(async tx => this.findTx(tx, query));
  }

  async insertTx(tx: DrizzleTransaction, param: R): Promise<M> {
    const [result] = await tx.insert(this.table).values(param).execute();

    const id = result.insertId as I;

    return this.findTx(tx, { id }).then(takeOnlyOne());
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

    return this.findTx(tx, { id }).then(takeOnlyOne());
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

    return this.findTx(tx, { id: oldbie.id }).then(takeOnlyOne());
  }

  // eslint-disable-next-line no-shadow
  async patch(oldbie: M, consumer: (oldbie: M) => M): Promise<M> {
    return this.withTransaction(async tx => this.patchTx(tx, oldbie, consumer));
  }

  async deleteTx(tx: DrizzleTransaction, id: I): Promise<void> {
    await tx
      .update(this.table)
      .set({ deletedAt: getKSTDate() })
      .where(eq(this.table.id, id))
      .execute();
  }

  async delete(id: I): Promise<void> {
    return this.withTransaction(async tx => this.deleteTx(tx, id));
  }
}
