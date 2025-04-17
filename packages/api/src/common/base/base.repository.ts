import { Inject, Injectable } from "@nestjs/common";
import {
  and,
  asc,
  between,
  ColumnBaseConfig,
  ColumnDataType,
  count,
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
  not,
  or,
  SQL,
  sql,
} from "drizzle-orm";
import { MySqlColumn, MySqlTable } from "drizzle-orm/mysql-core";
import { MySql2Database } from "drizzle-orm/mysql2";

import {
  DrizzleAsyncProvider,
  DrizzleTransaction,
} from "@sparcs-clubs/api/drizzle/drizzle.provider";
import {
  REPOSITORY_LOCK_ORDER_META_KEY,
  TransactionManagerService,
} from "@sparcs-clubs/api/drizzle/drizzle.transaction-manager";

import { IdType, IEntity, MEntity } from "../base/entity.model";
import { OrderByTypeEnum } from "../enums";
import {
  makeObjectPropsToDBTimezone,
  takeAll,
  takeOnlyOne,
} from "../util/util";

// 순수 plain object인 타입을 나타내는 타입
// 다른 파일로 옮겨도 됨
// 사실 array나 function이 안걸러지긴 한다는데 다들 object만 잘 넣을 거죠?
export type PlainObject = Record<string, unknown>;

export type MySqlColumnType = MySqlColumn<
  ColumnBaseConfig<ColumnDataType, string>
>;

// Clubs에서 사용하는 테이블에 id와 deletedAt 필드가 항상 있음을 보장하기 위한 interface
interface TableWithIdAndDeletedAt {
  id: MySqlColumn<ColumnBaseConfig<ColumnDataType, string>>;
  deletedAt: MySqlColumn<ColumnBaseConfig<ColumnDataType, string | null>>;
}

// MEntity 의 생성자
// static 메서드 및 인스턴스 생성자를 constructor 로 받을 수 있도록 선언한 타입
// 실제 repository 에서는 이 인터페이스를 사용 및 구현할 필요 없음
interface ModelConstructor<
  Model extends MEntity<IModel, Id>,
  IModel extends IEntity<Id>,
  Id extends IdType,
> {
  modelName: string;
  constructor: new (entity: IModel) => Model;
}

///////////////////////////////////////////////////////////////////////////////
// 주어진 Query에 대해 래핑 및 타입 확장을 해주기 위한 제네릭 선언부

// 쿼리 조건 래핑 및 확장을 위해 필요한 타입 선언
const mysqlQueryConditionOperators = [
  "eq",
  "ne",
  "gt",
  "gte",
  "lt",
  "lte",
  "like",
  "startsWith",
  "endsWith",
  "isNotNull",
] as const;

// 타입으로 변환
type MysqlQueryConditionOperators =
  (typeof mysqlQueryConditionOperators)[number];

const nestedQueryWrappingOperators = ["and", "or", "not"] as const;
type NestedQueryWrappingOperators =
  (typeof nestedQueryWrappingOperators)[number];

// 1. 쿼리 필드 확장하기
// 기본적인 쿼리 파라미터들

// Query에 대해 Id Field를 확장.
type BaseQuery<Query extends PlainObject, Id extends IdType> = Query & {
  id?: Id;
};

// 2. 필드 타입을 배열 및 복합쿼리로 확장
// 필드 타입을 배열 및 복합쿼리로 확장
type QueryFieldTypes<T> =
  | T
  | T[]
  | Partial<Record<MysqlQueryConditionOperators, T>>;

// 주어진 Query Object의 필드 타입을 배열 및 복합쿼리로 확장
// WhereClause를 만들기 위해 사용
export type BaseWhereQuery<Query extends PlainObject> = {
  [K in keyof Query]?: QueryFieldTypes<Query[K]>;
};

// id, ids, pagination, orderBy 등을 기본으로 지원하기 위함
interface PaginationAndOrderbyFields<OrderByKeys extends string> {
  pagination?: {
    offset: number;
    itemCount: number;
  };
  orderBy?: Record<OrderByKeys, OrderByTypeEnum>;
}

// 3. 쿼리가 주어지면 필드 확장 후 각 값들에 대해 래핑 및 타입 확장
// find에 사용
export type BaseRepositoryQuery<
  Query extends PlainObject,
  Id extends IdType,
  OrderByKeys extends string,
> = BaseWhereQuery<BaseQuery<Query, Id>> &
  PaginationAndOrderbyFields<OrderByKeys>;

///////////////////////////////////////////////////////////////////////////////
// 베이스 레포지토리 추상클래스
// 사용 방법
// 1. Model에 모델 클래스 넣기
// 2. Table에 FromDB (InferSelectTable) 타입 넣기
// 3. 쿼리 조건 추가 (id 등 제외)
// 4. 추가 쿼리 조건이 있을 경우 specialKeys에 추가하여 makeWhereClause를 상속하여 구현
@Injectable()
export abstract class BaseRepository<
  Model extends MEntity<IModel, Id>,
  IModel extends IEntity<Id>,
  DbSelect,
  DbInsert,
  DbUpdate,
  Table extends MySqlTable & TableWithIdAndDeletedAt, // &TableWith~ 를 통해 테이블에 ID와 deletedAt 필드가 항상 있음을 보장
  Query extends PlainObject,
  QuerySupport extends PlainObject,
  OrderByKeys extends string,
  Id extends IdType = number,
> {
  @Inject(DrizzleAsyncProvider) protected db: MySql2Database;
  @Inject(TransactionManagerService)
  protected txManager: TransactionManagerService;

  constructor(
    protected table: Table,
    protected readonly modelConstructor: ModelConstructor<Model, IModel, Id>, // 모델엔티티 넣으면 됨
  ) {
    Reflect.defineMetadata(
      REPOSITORY_LOCK_ORDER_META_KEY,
      modelConstructor.modelName,
      this.constructor,
    );
  }

  /**
   * @description DB -> Model
   * @description DB Result를 Model 인스턴스로 변환하는 작업
   * @description find에서 사용
   */
  abstract dbToModel(_result: DbSelect): Model;

  /**
   * @description Model -> DB
   * @description Model 인스턴스를 DB에 저장할 수 있는 형태로 변환하는 작업
   * @description update에서 사용
   */
  abstract modelToDB(model: Model): DbUpdate;

  /**
   * @description WhereClause를 만들기 위해 DB칼럼 <-> 필드 매핑 메서드
   * @description getTableField에서 wrapping 해서 사용
   * @returns 테이블 필드 또는 null (정상 작동)
   * @returns 기본 값으로 undefined를 리턴시켜야 함 (존재하지 않는 필드인 경우)
   * @warning 구현만 하고, 직접 사용하지 말 것
   */
  abstract fieldMap(
    field:
      | keyof BaseRepositoryQuery<Query, Id, OrderByKeys>
      | keyof QuerySupport,
  ): MySqlColumn | null | undefined;

  /**
   * @description fieldMap을 wrapping한 헬퍼 메서드
   * @description DB칼럼 <-> 필드 매핑 시에 제대로 정의되지 않은 필드를 걸러냄
   * @description makeWhereClause에서 사용
   */
  getTableField(
    field:
      | keyof BaseRepositoryQuery<Query, Id, OrderByKeys>
      | keyof QuerySupport,
  ): MySqlColumn | null {
    const column = this.fieldMap(field);
    if (column === undefined) {
      throw new Error(`Invalid field: ${String(field)}`);
    }
    return column;
  }

  // find, count는 왠만하면 makeWhereClause를 구현하면 처리 가능
  async findTx(
    tx: DrizzleTransaction,
    param: BaseRepositoryQuery<Query, Id, OrderByKeys>,
  ): Promise<Model[]> {
    let query = tx
      .select()
      .from(this.table)
      .where(this.makeWhereClause(makeObjectPropsToDBTimezone(param)))
      .$dynamic();

    if (param.pagination) {
      query = query.limit(param.pagination.itemCount);
      query = query.offset(
        (param.pagination.offset - 1) * param.pagination.itemCount,
      );
    }

    if (param.orderBy) {
      query = query.orderBy(...this.makeOrderBy(param.orderBy));
    }

    const result = await query.execute();

    return result.map(row => this.dbToModel(row as DbSelect));
  }

  async countTx(
    tx: DrizzleTransaction,
    param: BaseRepositoryQuery<Query, Id, OrderByKeys>,
  ): Promise<number> {
    const [result] = await tx
      .select({ count: count() })
      .from(this.table)
      .where(this.makeWhereClause(makeObjectPropsToDBTimezone(param)));

    return result.count;
  }

  async createTx(tx: DrizzleTransaction, param: DbInsert): Promise<Model> {
    const [result] = await tx.insert(this.table).values(param).execute();

    // insertId를 적절한 타입으로 변환
    const newId = result.insertId as Id;

    return this.fetchTx(tx, newId);
  }

  async putTx(tx: DrizzleTransaction, id: Id, param: DbUpdate): Promise<Model> {
    await tx
      .update(this.table)
      .set(param)
      .where(eq(this.table.id, id))
      .execute();

    return this.fetchTx(tx, id);
  }

  async patchTx(
    tx: DrizzleTransaction,
    oldId: Id,
    consumer: (oldbie: Model) => Model,
  ): Promise<Model> {
    const param = consumer(await this.fetchTx(tx, oldId));
    await tx
      .update(this.table)
      .set(param)
      .where(eq(this.table.id, oldId))
      .execute();

    return this.fetchTx(tx, oldId);
  }

  async deleteTx(tx: DrizzleTransaction, id: Id): Promise<void> {
    await tx
      .update(this.table)
      .set({ deletedAt: new Date() })
      .where(eq(this.table.id, id))
      .execute();
  }

  // 상속 후에도 사용하는 헬퍼 메서드
  async withTransaction<Result>(
    callback: (tx: DrizzleTransaction) => Promise<Result>,
  ): Promise<Result> {
    return this.db.transaction(callback);
  }

  /**
   * @description 트랜잭션에 락을 잡아주는 메서드
   * @description 상속할 떄 super.lockByQuery(tx, query, mode) 로 기본적인 쿼리 생성 (id 등)
   */
  async acquireLockByQuery(
    tx: DrizzleTransaction,
    query: BaseRepositoryQuery<Query, Id, OrderByKeys>,
    mode: "update" | "read" = "update",
  ) {
    const whereClause = this.makeWhereClause(query);
    const lockSql = mode === "read" ? "LOCK IN SHARE MODE" : "FOR UPDATE";

    await tx.execute(
      sql`SELECT 1 FROM ${this.table} WHERE ${whereClause} ${sql.raw(lockSql)}`,
    );
  }

  ///////////////////////////////////////////////////////////////////////////////
  // transaction manager에서 lock을 찾고 얻는 데 사용하는 함수
  getLockKey(): string {
    return (
      Reflect.getMetadata(REPOSITORY_LOCK_ORDER_META_KEY, this.constructor) ??
      "zzz"
    );
  }

  async lockByQuery(
    tx: DrizzleTransaction,
    query: BaseWhereQuery<BaseQuery<Query, Id>>,
    mode: "update" | "read" = "update",
  ): Promise<void> {
    const where = this.makeWhereClause(query);
    const lockMode = mode === "read" ? "LOCK IN SHARE MODE" : "FOR UPDATE";
    await tx.execute(
      sql`SELECT 1 FROM ${this.table} WHERE ${where} ${sql.raw(lockMode)}`,
    );
  }

  ///////////////////////////////////////////////////////////////////////////////
  // 이 아래는 바꿀 필요 없음

  /**
   * @description where 절을 생성하는 메서드
   * @description find와 count에서 사용
   * @description 상속할 떄 super.makeWhereClause(param) 로 기본적인 쿼리 생성해서 사용해야 함 (id 등)
   * @description 기본적으로, eq 및 inArray 조건을 처리함
   * @description 이외의 경우 processAdvancedOperators와 processNestedQuery 메서드로 처리
   */
  protected makeWhereClause(
    param: BaseRepositoryQuery<Query, Id, OrderByKeys>,
    specialKeys?: string[], // 제외할 키들 ex) duration ...
  ): SQL {
    const whereClause: SQL[] = [];

    whereClause.push(isNull(this.table.deletedAt));

    // Query 타입의 모든 키를 순회하면서 파라미터에 해당 값이 있는지 확인
    const defaultKeys = ["pagination", "orderBy"];
    if (specialKeys) {
      defaultKeys.push(...specialKeys);
    }

    Object.keys(param)
      .filter(key => !defaultKeys.includes(key)) // 기본 키는 제외
      .forEach(key => {
        if (this.isNestedQueryWrapper(key)) {
          whereClause.push(
            this.processNestedQuery({
              [key]: param[key],
            }),
          );
        } else {
          // 파라미터 값이 존재하는 경우
          const value = param[key];
          if (value !== undefined) {
            // Query 필드를 테이블 필드로 변환
            // 복잡한 쿼리의 경우 specialKeys에 추가하여 이 메서드에서는 무시하고, 상속받은 메서드에서 처리
            const tableField = this.getTableField(key as keyof Query);
            if (!tableField) {
              // tableField가 null: date, duration 등 특수한 경우
              throw new Error(
                `You should add this field to the SpecialKeys: ${key}`,
              );
            }

            // 배열인 경우 IN 연산자 사용
            if (Array.isArray(value)) {
              if (value.length === 0) {
                throw new Error(`Value Array is empty: ${key} ${value}`);
              }
              whereClause.push(inArray(tableField, value));
            }
            // null 인 경우 isNull 연산자 사용
            else if (value === null) {
              whereClause.push(isNull(tableField));
            }
            // 단일 값인 경우 eq 연산자 사용
            else if (
              typeof value === "string" ||
              typeof value === "number" ||
              typeof value === "boolean" ||
              value instanceof Date
            ) {
              whereClause.push(eq(tableField, value));
            }
            // 복합 조건 객체인 경우 복합 조건 처리 (gt, lt, gte, lte 등)
            // 예시: { between: [10, 20] }, { gt: 10 }
            else if (
              typeof value === "object" &&
              Object.keys(value).length > 0 && // date인 경우 keys가 []임
              Object.keys(value).every(k =>
                mysqlQueryConditionOperators.includes(
                  k as MysqlQueryConditionOperators,
                ),
              )
            ) {
              whereClause.push(
                this.processAdvancedOperators(key as keyof Query, value),
              );
            } else {
              // 예상치 못한 값이나 undefined가 전달된 경우
              throw new Error(`Invalid key value: ${key} ${value}`);
            }
          }
        }
      });

    return whereClause.length > 1 ? and(...whereClause) : whereClause[0];
  }

  /**
   * @description 중첩 쿼리 오브젝트를 처리하는 메서드
   * @description 중첩인 and, or, not 쿼리를 다시 makeWhereClause와 processAdvancedOperators로 처리
   */

  protected processNestedQuery(condition: {
    and?: Record<string, object>;
    or?: Record<string, object>;
    not?: Record<string, object>;
  }): SQL {
    if (Object.keys(condition).length !== 1) {
      throw new Error("Invalid condition");
    }
    const [wrapper, conditions] = Object.entries(condition)[0];

    const whereClause = Object.entries(conditions).map(([key, value]): SQL => {
      if (this.isNestedQueryWrapper(key)) {
        return this.processNestedQuery({
          [key]: value as Record<string, object>,
        });
      }
      return this.processAdvancedOperators(
        key as keyof Query,
        value as Record<MysqlQueryConditionOperators, unknown>,
      );
    });
    if (wrapper === "and") {
      return and(...whereClause);
    }
    if (wrapper === "or") {
      return or(...whereClause);
    }
    if (wrapper === "not") {
      if (whereClause.length !== 1) {
        throw new Error(
          "Not operator can only be used with a single condition",
        );
      }
      return not(whereClause[0]);
    }
    throw new Error(`Invalid wrapper: ${wrapper}`);
  }

  private isNestedQueryWrapper(
    key: string,
  ): key is NestedQueryWrappingOperators {
    return nestedQueryWrappingOperators.includes(
      key as NestedQueryWrappingOperators,
    );
  }
  /**
   * @description 고급 연산자 오브젝트를 처리하는 메서드
   * @description 처리 가능 연산자: gt, gte, lt, lte, like, isNotNull, between, startsWith, endsWith
   */
  protected processAdvancedOperators(
    queryField: keyof Query,
    conditions: Partial<Record<MysqlQueryConditionOperators, unknown>>,
  ): SQL {
    // Query 필드를 테이블 필드로 변환
    const tableField = this.fieldMap(queryField);
    if (!tableField) {
      throw new Error(`Invalid query field: ${String(queryField)}`);
    }
    if (Object.keys(conditions).length === 0) {
      throw new Error(`Empty conditions: ${String(conditions)}`);
    }

    const whereClause: SQL[] = [];
    // 객체의 키-값 쌍을 forEach로 순회
    Object.entries(conditions).forEach(([operator, operand]) => {
      if (operand === undefined || operand === null) {
        throw new Error(`Invalid operand: ${operand}`);
      }
      switch (operator) {
        case "eq":
          whereClause.push(eq(tableField, operand));
          break;
        case "ne":
          whereClause.push(ne(tableField, operand));
          break;
        case "gt":
          whereClause.push(gt(tableField, operand));
          break;
        case "gte":
          whereClause.push(gte(tableField, operand));
          break;
        case "lt":
          whereClause.push(lt(tableField, operand));
          break;
        case "lte":
          whereClause.push(lte(tableField, operand));
          break;
        case "isNotNull":
          whereClause.push(isNotNull(tableField));
          break;
        case "between":
          if (!Array.isArray(operand) || operand.length !== 2) {
            throw new Error(
              `Invalid operator and operand for between: ${tableField} ${operand}`,
            );
          }
          whereClause.push(between(tableField, operand[0], operand[1]));
          break;
        case "like":
          whereClause.push(like(tableField, `%${String(operand)}%`));
          break;
        case "startsWith":
          whereClause.push(like(tableField, `${String(operand)}%`));
          break;
        case "endsWith":
          whereClause.push(like(tableField, `%${String(operand)}`));
          break;
        default:
          throw new Error(`Invalid operator: ${operator}`);
      }
    });
    return whereClause.length > 1 ? and(...whereClause) : whereClause[0];
  }

  // 여러 필드에 대한 정렬을 지원하는 구현
  // find에서 사용
  protected makeOrderBy(order: Record<string, OrderByTypeEnum>): SQL[] {
    const orderClauses: SQL[] = [];

    // 객체의 키-값 쌍을 순회하며 정렬 조건 생성
    Object.entries(order).forEach(([field, direction]) => {
      // Query 필드를 테이블 필드로 변환
      const tableField = this.getTableField(field as keyof Query);
      // 테이블에 해당 필드가 존재하는지 확인
      if (tableField) {
        // direction에 따라 asc() 또는 desc() 호출
        if (direction === OrderByTypeEnum.ASC) {
          orderClauses.push(asc(tableField));
        } else {
          orderClauses.push(desc(tableField));
        }
      } else {
        throw new Error(`Invalid order field: ${field}`);
      }
    });

    return orderClauses;
  }

  // private 헬퍼 메서드들

  // 재구현 필요 X인 부분들
  // TX 메서드만 구현하면 자동 반영

  async find(
    param: BaseRepositoryQuery<Query, Id, OrderByKeys>,
  ): Promise<Model[]> {
    return this.withTransaction(async tx => this.findTx(tx, param));
  }

  async count(
    param: BaseRepositoryQuery<Query, Id, OrderByKeys>,
  ): Promise<number> {
    return this.withTransaction(async tx => this.countTx(tx, param));
  }

  async create(param: DbInsert): Promise<Model> {
    return this.withTransaction(async tx => this.createTx(tx, param));
  }

  async put(id: Id, param: DbUpdate): Promise<Model> {
    return this.withTransaction(async tx => this.putTx(tx, id, param));
  }

  async patch(oldId: Id, consumer: (oldbie: Model) => Model): Promise<Model> {
    return this.txManager.runInTransaction(async tx =>
      this.patchTx(tx, oldId, consumer),
    );
  }

  async delete(id: Id): Promise<void> {
    return this.txManager.runInTransaction(async tx => this.deleteTx(tx, id));
  }

  async fetchTx(tx: DrizzleTransaction, id: Id): Promise<Model> {
    const param = { id } as BaseRepositoryQuery<Query, Id, OrderByKeys>;
    return this.findTx(tx, param).then(
      takeOnlyOne<Model, Id>(this.modelConstructor.modelName),
    );
  }

  // id(ids) 로 쿼리하는 함수들
  // 재구현 필요 X
  async fetch(id: Id): Promise<Model> {
    return this.txManager.runInTransaction(async tx => this.fetchTx(tx, id));
  }

  async fetchAllTx(tx: DrizzleTransaction, ids: Id[]): Promise<Model[]> {
    const param = { ids } as BaseRepositoryQuery<Query, Id, OrderByKeys>;
    return this.findTx(tx, param).then(
      takeAll<Model, Id>(ids, this.modelConstructor.modelName),
    );
  }

  async fetchAll(ids: Id[]): Promise<Model[]> {
    return this.txManager.runInTransaction(async tx =>
      this.fetchAllTx(tx, ids),
    );
  }
}

// backlog
// 1. 테이블 필드 매핑 메서드 추가
// 2. tx 메서드들 impl로 바꾸고 각 ModelBase로 옮기기
// 3. update patch에 where clause 및 batch 추가
// 4. lock 시스템의 withTransaction 으로 변경
