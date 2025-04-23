import { Inject, Injectable } from "@nestjs/common";
import {
  and,
  asc,
  between,
  ColumnBaseConfig,
  ColumnDataType,
  desc,
  eq,
  gt,
  gte,
  inArray,
  InferSelectModel,
  isNotNull,
  isNull,
  like,
  lt,
  lte,
  ne,
  not,
  or,
  SQL,
} from "drizzle-orm";
import { MySqlColumn, MySqlTable } from "drizzle-orm/mysql-core";
import { MySql2Database } from "drizzle-orm/mysql2";

import {
  DrizzleAsyncProvider,
  DrizzleTransaction,
} from "@sparcs-clubs/api/drizzle/drizzle.provider";
import {
  getLockKeyOfClass,
  Lockable,
  REPOSITORY_LOCK_ORDER_META_KEY,
  TransactionManagerService,
} from "@sparcs-clubs/api/drizzle/drizzle.transaction-manager";

import { IdType, MEntity, ModelPatchFunction } from "../base/entity.model";
import { OrderByTypeEnum } from "../enums";
import {
  makeObjectPropsFromDBTimezone,
  makeObjectPropsToDBTimezone,
  takeAll,
  takeOnlyOne,
} from "../util/util";

// 순수 plain object인 타입을 나타내는 타입
// 다른 파일로 옮겨도 됨
// 사실 array나 function이 안걸러지긴 한다는데 다들 object만 잘 넣을 거죠?
export type PlainObject = Record<string, unknown>;

// mysql 테이블 및 컬럼 설정 타입

export type MySqlColumnType = MySqlColumn<
  ColumnBaseConfig<ColumnDataType, string>
>;

// type ColumnBaseWithAutoPK = ColumnBaseConfig<ColumnDataType, string> & {
//   notNull: true;
//   hasDefault: true;
//   primaryKey: true;
// };

// export type TableWithID = MySqlTable<{
//   name: string;
//   schema: string | undefined;
//   dialect: "mysql";
//   columns: {
//     id: MySqlColumn<ColumnBaseWithAutoPK>;
//     deletedAt: MySqlColumn<ColumnBaseConfig<ColumnDataType, "deletedAt">>;
//   } & Record<string, MySqlColumn<ColumnBaseConfig<ColumnDataType, string>>>;
// }> & { id: MySqlColumnType; deletedAt: MySqlColumnType };

// export type TableWithID = MySqlTable<{
//   name: string;
//   schema: string | undefined;
//   dialect: "mysql";
//   columns: {
//     id: MySqlColumn<ColumnBaseWithAutoPK>;
//     deletedAt: MySqlColumnType;
//   } & {
//     [key: string]: MySqlColumn<ColumnBaseConfig<ColumnDataType, string>>;
//   };
// }> & { id: MySqlColumnType; deletedAt: MySqlColumnType };

export type TableWithID = MySqlTable & {
  id: MySqlColumnType;
  deletedAt: MySqlColumnType;
};

export type MultiTableWithID = {
  main: TableWithID;
  oneToOne: Record<string, TableWithID>;
  oneToMany: Record<string, TableWithID>;
};

export type InferUpdateModel<Table extends TableWithID> = Partial<
  InferSelectModel<Table>
>;

// MEntity 의 생성자
// static 메서드 및 인스턴스 생성자를 constructor 로 받을 수 있도록 선언한 타입
// 실제 repository 에서는 이 인터페이스를 사용 및 구현할 필요 없음
export interface ModelConstructor<
  Model extends MEntity<Id>,
  Id extends IdType,
> {
  modelName: string;
  new (entity: Model): Model;
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
type BaseQuery<Query extends PlainObject, Id extends IdType = number> = Omit<
  Query,
  "id"
> & {
  id: AdvancedQueryValueTypes<Id>;
};

// 2. 필드 타입을 배열 및 복합쿼리로 확장
// 필드 타입을 배열 및 복합쿼리로 확장
type AdvancedQueryValueTypes<T> =
  | T
  | T[]
  | Partial<Record<MysqlQueryConditionOperators, T>>;

// 주어진 Query Object의 필드 타입을 배열 및 복합쿼리로 확장
// WhereClause를 만들기 위해 사용
type AdvancedQuery<Query extends PlainObject> = {
  [K in keyof Query]?: AdvancedQueryValueTypes<Query[K]>;
};

// processAdvancedOperators의 param 타입
type AdvancedConditionalValue<T extends PrimitiveConditionValue> = Partial<
  Record<MysqlQueryConditionOperators, T>
>;

// 중첩 쿼리 타입
// 쿼리에 and or not으로 감싼 조건이 추가되게 함
type NestedQuery<Query extends PlainObject> = Query & {
  and?: NestedQuery<Query>;
  or?: NestedQuery<Query>;
  not?: NestedQuery<Query>;
};

export type PrimitiveConditionValue =
  | number
  | string
  | boolean
  | Date
  | Array<unknown>
  | null;

// 중첩과 복합 쿼리를 도입
// 결과: { id: 1, and: { id:2, or: { name: "test", name: {like:"test"} } } }
type BaseNestedAdvancedQuery<
  Query extends PlainObject,
  QuerySupport extends PlainObject = {},
  Id extends IdType = number,
> = NestedQuery<AdvancedQuery<BaseQuery<Query, Id> & QuerySupport>>;

// Pagination & OrderBy
type OrderByQuery<OrderByKeys extends string = "id"> = Partial<
  Record<OrderByKeys, OrderByTypeEnum>
>;

type PaginationAndOrderbyFields<OrderByKeys extends string = "id"> = {
  pagination?: {
    offset: number;
    itemCount: number;
  };
  orderBy?: OrderByQuery<OrderByKeys>;
};

// 3. 쿼리가 주어지면 필드 확장 후 각 값들에 대해 래핑 및 타입 확장
// 기본 레포지토리 메서드 파라미터 쿼리: count, find, put, patch, delete, lock 등의 where 외부로 향하는 where 절에 사용함
export type BaseRepositoryQuery<
  Query extends PlainObject,
  Id extends IdType = number,
> = BaseNestedAdvancedQuery<Query, {}, Id>;

// Pagination & OrderBy 추가: find에 사용
export type BaseRepositoryFindQuery<
  Query extends PlainObject,
  OrderByKeys extends string = "id",
  Id extends IdType = number,
> = BaseNestedAdvancedQuery<Query, {}, Id> &
  PaginationAndOrderbyFields<OrderByKeys>;

// QuerySupport 타입을 추가한 내부 where clause 메이커 함수용 타입
export type BaseWhereQuery<
  Query extends PlainObject,
  QuerySupport extends PlainObject = {},
  Id extends IdType = number,
> = BaseNestedAdvancedQuery<Query, QuerySupport, Id>;

// 4. 테이블 칼럼 <-> 모델 필드 매핑 필드 키 타입
export type BaseTableFieldMapKeys<
  Query extends PlainObject,
  OrderByKeys extends string = "id",
  QuerySupport extends PlainObject = {},
> = keyof Query | OrderByKeys | keyof QuerySupport | "id";

export type BaseWhereQueryKeys<
  Query extends PlainObject,
  QuerySupport extends PlainObject = {},
  Id extends IdType = number,
> = keyof (BaseQuery<Query, Id> & QuerySupport);

///////////////////////////////////////////////////////////////////////////////
// 베이스 레포지토리 추상클래스
// 사용 방법
// 1. Model에 모델 클래스 넣기
// 2. Table에 FromDB (InferSelectTable) 타입 넣기
// 3. 쿼리 조건 추가 (id 등 제외)
// 4. 추가 쿼리 조건이 있을 경우 specialKeys에 추가하여 makeWhereClause를 상속하여 구현
@Injectable()
export abstract class BaseRepository<
  Model extends MEntity<Id> & IModelCreate,
  IModelCreate,
  DbSelect,
  DbInsert,
  DbUpdate,
  Query extends PlainObject,
  OrderByKeys extends string = "id", // 정렬에 사용되는 필드들
  QuerySupport extends PlainObject = {}, // 직접 쿼리는 안되지만, 쿼리 조건에 보조로 들어가는 필드들. ex) startTerm & EndTerm for duration and date
  Id extends IdType = number,
> implements Lockable<BaseRepositoryQuery<Query, Id>>
{
  @Inject(DrizzleAsyncProvider) protected db: MySql2Database;
  @Inject(TransactionManagerService)
  protected txManager: TransactionManagerService;

  constructor(
    protected readonly mainModelConstructor: ModelConstructor<Model, Id>, // 모델엔티티 넣으면 됨
    protected readonly table: TableWithID | MultiTableWithID,
  ) {
    Reflect.defineMetadata(
      REPOSITORY_LOCK_ORDER_META_KEY,
      mainModelConstructor.modelName,
      this.constructor,
    );
  }

  /**
   * @description DB -> Model
   * @description DB Result를 Model 인스턴스로 변환하는 작업
   * @description find에서 사용
   */
  protected abstract dbToModelMapping(result: DbSelect): Model;

  /**
   * @description Model -> DB
   * @description Model 인스턴스를 DB에 저장할 수 있는 형태로 변환하는 작업
   * @description update에서 사용
   */
  protected abstract modelToDBMapping(model: Model): DbUpdate;

  /**
   * @description ModelCreate -> DB
   * @description ModelCreate 인스턴스를 DB에 저장할 수 있는 형태로 변환하는 작업
   * @description create에서 사용
   */
  protected abstract createToDBMapping(model: IModelCreate): DbInsert;

  /**
   * @description WhereClause를 만들기 위해 DB칼럼 <-> 필드 매핑 메서드
   * @description getTableOfField에서 wrapping 해서 사용
   * @returns 테이블 필드 또는 null (정상 작동)
   * @returns 기본 값으로 undefined를 리턴시켜야 함 (존재하지 않는 필드인 경우)
   * @warning 구현만 하고, 상속 레포지토리 클래스 내부에서 직접 사용하지 말 것
   */
  protected abstract fieldMap(
    field: BaseTableFieldMapKeys<Query, OrderByKeys, QuerySupport>,
  ): TableWithID | null | undefined;

  /**
   * @description 특수한 조건을 처리하는 메서드
   * @description 모델 필드에는 없는 조건으로 처리하고자 할 때 구현하기
   * @description 여기에 속하는 필드는 fieldMap에서 null로 처리되어야 함
   * @description 예시: duration, date 등
   * @description value의 타입은 상속할때 명시할 것
   * @description 예시: { duration: { startTerm: new Date(), endTerm: new Date() } }, {date: new Date("2025-04-18T00:00:00.000Z")}
   */
  protected abstract processSpecialCondition(
    key: BaseTableFieldMapKeys<Query, OrderByKeys, QuerySupport>,
    value: PrimitiveConditionValue,
  ): SQL;

  // find, count는 왠만하면 makeWhereClause를 구현하면 처리 가능
  protected abstract findImplementation(
    query: BaseRepositoryFindQuery<Query, OrderByKeys, Id>,
    tx: DrizzleTransaction,
  ): Promise<Model[]>;

  protected abstract countImplementation(
    query: BaseRepositoryQuery<Query, Id>,
    tx: DrizzleTransaction,
  ): Promise<number>;

  protected abstract createImplementation(
    data: IModelCreate[],
    tx: DrizzleTransaction,
  ): Promise<Model[]>;

  protected abstract putImplementation(
    model: Model,
    tx: DrizzleTransaction,
  ): Promise<Model>;

  protected abstract patchImplementation(
    query: BaseRepositoryQuery<Query, Id>,
    patchFunction: ModelPatchFunction<Model, Id>,
    tx: DrizzleTransaction,
  ): Promise<Model[]>;

  protected abstract deleteImplementation(
    query: BaseRepositoryQuery<Query, Id>,
    tx: DrizzleTransaction,
  ): Promise<boolean>;

  /**
   * @description 락을 잡는 쿼리를 실행하는 메서드
   * @description Single 테이블일 때랑 멀티 테이블일 때랑 구현이 다르기에, BaseRepository에서 구현해야 함
   */
  protected abstract executeLockQuery(
    tx: DrizzleTransaction,
    query: BaseRepositoryQuery<Query, Id>,
    lockSql: string,
  ): Promise<void>;

  ///////////////////////////////////////////////////////////////////////////////
  // db <-> model 매핑 메서드
  /**
   * @description DB -> Model
   * @description Model이 되기 전에, DB Result에서 9시간을 빼는 조작을 함
   */
  protected dbToModel(result: DbSelect): Model {
    return this.dbToModelMapping(makeObjectPropsFromDBTimezone(result));
  }

  /**
   * @description Model -> DB
   * @description Model이 DB에 저장되기 전에, 9시간을 더하는 조작을 함
   */
  protected modelToDB(model: Model): DbUpdate {
    return makeObjectPropsToDBTimezone(this.modelToDBMapping(model));
  }

  ///////////////////////////////////////////////////////////////////////////////
  // 락 관련 메서드

  /**
   * @description transaction manager에서 lock을 잡기 위한 priory를 얻기 위해 사용하는 메서드
   * @description 레포지토리 락 우선순위 값(string)을 리턴함
   */
  getLockKey(): string {
    return getLockKeyOfClass(
      this.constructor as new (...args: unknown[]) => unknown,
    );
  }

  /**
   * @description 트랜잭션에 락을 잡아주는 메서드
   * @description executeLockQuery에서 sql 구현
   */
  async acquireLock(
    tx: DrizzleTransaction,
    query: BaseRepositoryQuery<Query, Id>,
    mode: "update" | "read" = "update",
  ): Promise<void> {
    const lockSql = mode === "read" ? "LOCK IN SHARE MODE" : "FOR UPDATE";

    await this.executeLockQuery(tx, query, lockSql);
  }

  ///////////////////////////////////////////////////////////////////////////////
  // query에 따른 where 절 생성 관련 메서드들

  /**
   * @description where 절을 생성하는 메서드
   */
  protected makeWhereClause(query: BaseRepositoryQuery<Query, Id>): SQL {
    const whereClause: SQL[] = [];

    const timeProcessedQuery = makeObjectPropsToDBTimezone(query);

    whereClause.push(...this.getTables().map(table => isNull(table.deletedAt)));

    // Query 타입의 모든 키를 순회하면서 파라미터에 해당 값이 있는지 확인
    const defaultKeys = ["pagination", "orderBy"];

    Object.entries(timeProcessedQuery)
      .filter(([key, _]) => !defaultKeys.includes(key)) // 기본 키는 제외
      .forEach(([key, value]) => {
        whereClause.push(
          this.processQuery(
            key,
            value as BaseWhereQuery<Query, QuerySupport, Id>,
          ),
        );
      });

    return whereClause.length > 1 ? and(...whereClause) : whereClause[0];
  }

  /**
   * @description fieldMap을 wrapping한 헬퍼 메서드
   * @description DB칼럼 <-> 필드 매핑 시에 제대로 정의되지 않은 필드를 걸러냄
   * @description makeWhereClause에서 사용
   */
  private getTableOfField(
    field: BaseTableFieldMapKeys<Query, OrderByKeys, QuerySupport>,
  ): TableWithID | null {
    const column = this.fieldMap(field);
    if (column === undefined) {
      throw new Error(`Invalid field: ${String(field)}`);
    }
    return column;
  }

  private isMultiTable(): boolean {
    return (
      "main" in this.table &&
      "oneToOne" in this.table &&
      "oneToMany" in this.table
    );
  }

  // 속한 모델의 테이블들을 flat한 배열로 반환해주는 함수
  private getTables(): TableWithID[] {
    if (this.isMultiTable()) {
      const tables = this.table as MultiTableWithID;
      return [
        tables.main,
        ...Object.values(tables.oneToOne),
        ...Object.values(tables.oneToMany),
      ];
    }
    return [this.table as TableWithID];
  }

  private processQuery(
    key:
      | BaseWhereQueryKeys<Query, QuerySupport, Id>
      | NestedQueryWrappingOperators,
    value:
      | BaseWhereQuery<Query, QuerySupport, Id>
      | PrimitiveConditionValue
      | AdvancedConditionalValue<PrimitiveConditionValue>,
  ): SQL {
    if (this.isNestedQueryWrapper(String(key))) {
      // key가 and or not 인 경우 중첩 쿼리 처리
      return this.processNestedQuery(
        key as NestedQueryWrappingOperators,
        value as BaseWhereQuery<Query, QuerySupport, Id>,
      );
    }
    if (this.isPrimitiveCondition(value)) {
      // value가 값 or 배열 or null 인 경우 단순 조건 처리
      return this.processPrimitiveCondition(
        key as BaseWhereQueryKeys<Query, QuerySupport, Id>,
        value as PrimitiveConditionValue,
      );
    }
    if (this.isAdvancedCondition(value)) {
      // value가 고급 쿼리 오브젝트 인 경우 고급 연산자 처리
      return this.processAdvancedCondition(
        key as BaseWhereQueryKeys<Query, QuerySupport, Id>,
        value as AdvancedConditionalValue<PrimitiveConditionValue>,
      );
    }
    throw new Error(`Invalid condition: ${String(key)} ${value}`);
  }

  /**
   * @description 중첩 쿼리 오브젝트를 처리하는 메서드
   * @description 중첩인 and, or, not 쿼리를 다시 makeWhereClause와 processAdvancedOperators로 처리
   */

  private processNestedQuery(
    wrapper: NestedQueryWrappingOperators,
    conditions: BaseWhereQuery<Query, QuerySupport, Id>,
  ): SQL {
    if (!this.isNestedQueryWrapper(wrapper)) {
      throw new Error(`Invalid wrapper condition : ${wrapper} ${conditions}`);
    }
    const whereClause = Object.entries(conditions).map(
      ([key, value]): SQL =>
        this.processQuery(
          key,
          value as BaseWhereQuery<Query, QuerySupport, Id>,
        ),
    );
    if (whereClause.length === 0) {
      throw new Error(`Where clause is empty for conditions: ${conditions}`);
    }
    if (wrapper === "and") {
      return and(...whereClause);
    }
    if (wrapper === "or") {
      return or(...whereClause);
    }
    if (wrapper === "not") {
      if (whereClause.length !== 1) {
        throw new Error(
          `Not operator can only be used with a single condition: ${conditions}`,
        );
      }
      return not(whereClause[0]);
    }
    throw new Error(`Invalid wrapper: ${wrapper}`);
  }

  private isNestedQueryWrapper(
    wrapper: string,
  ): wrapper is NestedQueryWrappingOperators {
    return (
      typeof wrapper === "string" &&
      nestedQueryWrappingOperators.includes(
        wrapper as NestedQueryWrappingOperators,
      )
    );
  }

  /**
   * @description 단순 조건 (eq, inArray, null) 이 들어온 경우 처리
   * @description 예시: { id: 10 }, { id: [10, 20] }, { endTerm: null }
   */
  private processPrimitiveCondition(
    key: BaseWhereQueryKeys<Query, QuerySupport, Id>,
    value: PrimitiveConditionValue,
  ): SQL {
    if (!this.isPrimitiveCondition(value)) {
      // 방지 함수
      throw new Error(`Invalid primitive condition: ${String(key)} ${value}`);
    }
    const table = this.getTableOfField(key);
    if (table === null) {
      // getTableOfField가 null인 경우 SpecialCondition에서 처리
      // getTableOfField가 null인 경우 === 모델 필드에 없는 특수 조건
      return this.processSpecialCondition(key, value);
    }
    const column = table[key as keyof typeof table] as MySqlColumnType;
    if (Array.isArray(value)) {
      if (value.length === 0) {
        throw new Error(`Value Array is empty: ${String(key)} ${value}`);
      }
      return inArray(column, value);
    }
    if (value === null) {
      return isNull(column);
    }
    if (value instanceof Date) {
      return eq(column, value);
    }
    if (
      typeof value === "boolean" ||
      typeof value === "number" ||
      typeof value === "string"
    ) {
      return eq(column, value);
    }

    throw new Error(`Invalid query key - value: { ${String(key)}: ${value} }`);
  }

  private isPrimitiveCondition(
    value: unknown,
  ): value is PrimitiveConditionValue {
    if (
      Array.isArray(value) ||
      value === null ||
      value instanceof Date ||
      typeof value === "boolean" ||
      typeof value === "number" ||
      typeof value === "string"
    ) {
      return true;
    }

    return false;
  }

  /**
   * @description 고급 연산자 오브젝트를 처리하는 메서드
   * @description 처리 가능 연산자: gt, gte, lt, lte, like, isNotNull, between, startsWith, endsWith
   */
  private processAdvancedCondition<T extends PrimitiveConditionValue>(
    queryField: BaseWhereQueryKeys<Query, QuerySupport, Id>,
    conditions: AdvancedConditionalValue<T>,
  ): SQL {
    if (!this.isAdvancedCondition(conditions)) {
      throw new Error(
        `Invalid advanced condition: ${String(queryField)} ${conditions}`,
      );
    }
    // Query 필드를 테이블 필드로 변환
    const table = this.getTableOfField(queryField);
    if (table === null) {
      throw new Error(
        `Special condition should be used in only primitive way!: ${String(queryField)}`,
      );
    }
    if (!(queryField in table)) {
      throw new Error(
        `Invalid column key in table: ${String(queryField)} in ${table}`,
      );
    }
    const column = table[queryField as keyof typeof table] as MySqlColumnType;

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
          whereClause.push(eq(column, operand));
          break;
        case "ne":
          whereClause.push(ne(column, operand));
          break;
        case "gt":
          whereClause.push(gt(column, operand));
          break;
        case "gte":
          whereClause.push(gte(column, operand));
          break;
        case "lt":
          whereClause.push(lt(column, operand));
          break;
        case "lte":
          whereClause.push(lte(column, operand));
          break;
        case "isNotNull":
          whereClause.push(isNotNull(column));
          break;
        case "between":
          if (!Array.isArray(operand) || operand.length !== 2) {
            throw new Error(
              `Invalid operator and operand for between: ${column} ${operand}`,
            );
          }
          whereClause.push(between(column, operand[0], operand[1]));
          break;
        case "like":
          whereClause.push(like(column, `%${String(operand)}%`));
          break;
        case "startsWith":
          whereClause.push(like(column, `${String(operand)}%`));
          break;
        case "endsWith":
          whereClause.push(like(column, `%${String(operand)}`));
          break;
        default:
          throw new Error(`Invalid operator: ${operator}`);
      }
    });
    return whereClause.length > 1 ? and(...whereClause) : whereClause[0];
  }

  private isAdvancedCondition<T extends PrimitiveConditionValue>(
    value: unknown,
  ): value is AdvancedConditionalValue<T> {
    if (
      typeof value === "object" &&
      value !== null &&
      Object.keys(value).length > 0 &&
      Object.keys(value).every(k =>
        mysqlQueryConditionOperators.includes(
          k as MysqlQueryConditionOperators,
        ),
      )
    ) {
      return true;
    }
    return false;
  }

  // 여러 필드에 대한 정렬을 지원하는 구현
  // find에서 사용
  protected makeOrderBy(order: OrderByQuery<OrderByKeys>): SQL[] {
    const orderClauses: SQL[] = [];

    // 객체의 키-값 쌍을 순회하며 정렬 조건 생성
    Object.entries(order).forEach(([field, direction]) => {
      // Query 필드를 테이블 필드로 변환
      const table = this.getTableOfField(field as keyof Query);
      if (table === null) {
        throw new Error(`Invalid order field for table: ${field}`);
      }
      const column = table[field as keyof typeof table] as MySqlColumnType;

      // 테이블에 해당 필드가 존재하는지 확인
      if (column) {
        // direction에 따라 asc() 또는 desc() 호출
        if (direction === OrderByTypeEnum.ASC) {
          orderClauses.push(asc(column));
        } else {
          orderClauses.push(desc(column));
        }
      } else {
        throw new Error(`Invalid order field for table: ${table} ${field}`);
      }
    });

    return orderClauses;
  }

  // private 헬퍼 메서드들

  // 재구현 필요 X인 부분들
  // TX 메서드만 구현하면 자동 반영

  async find(
    query: BaseRepositoryFindQuery<Query, OrderByKeys, Id>,
    tx?: DrizzleTransaction,
  ): Promise<Model[]> {
    const resPromise = tx
      ? this.findImplementation(query, tx)
      : this.txManager.runInTransaction(tsx =>
          this.findImplementation(query, tsx),
        );
    const res = await resPromise;
    return res;
  }

  async count(
    query: BaseRepositoryQuery<Query, Id>,
    tx?: DrizzleTransaction,
  ): Promise<number> {
    const resPromise = tx
      ? this.countImplementation(query, tx)
      : this.txManager.runInTransaction(tsx =>
          this.countImplementation(query, tsx),
        );
    const res = await resPromise;
    return res;
  }

  async create(
    data: IModelCreate[] | IModelCreate,
    tx?: DrizzleTransaction,
  ): Promise<Model[]> {
    const insertData = Array.isArray(data) ? data : [data];
    const resPromise = tx
      ? this.createImplementation(insertData, tx)
      : this.txManager.runInTransaction(async tsx =>
          this.createImplementation(insertData, tsx),
        );
    const res = await resPromise;
    return res;
  }

  async put(model: Model, tx?: DrizzleTransaction): Promise<Model> {
    const resPromise = tx
      ? this.putImplementation(model, tx)
      : this.txManager.runInTransaction(async tsx =>
          this.putImplementation(model, tsx),
        );
    const res = await resPromise;
    return res;
  }

  async patch(
    query: BaseRepositoryQuery<Query, Id>,
    patchFunction: ModelPatchFunction<Model, Id>,
    tx?: DrizzleTransaction,
  ): Promise<Model[]> {
    const resPromise = tx
      ? this.patchImplementation(query, patchFunction, tx)
      : this.txManager.runInTransaction(async tsx =>
          this.patchImplementation(query, patchFunction, tsx),
        );
    const res = await resPromise;
    return res;
  }

  async delete(
    query: BaseRepositoryQuery<Query, Id>,
    tx?: DrizzleTransaction,
  ): Promise<boolean> {
    const resPromise = tx
      ? this.deleteImplementation(query, tx)
      : this.txManager.runInTransaction(async tsx =>
          this.deleteImplementation(query, tsx),
        );
    const res = await resPromise;
    return res;
  }

  async fetch(id: Id, tx?: DrizzleTransaction): Promise<Model> {
    const resPromise = tx
      ? this.findImplementation(
          { id } as BaseRepositoryFindQuery<Query, OrderByKeys, Id>,
          tx,
        ).then(takeOnlyOne())
      : this.txManager.runInTransaction(async tsx =>
          this.findImplementation(
            { id } as BaseRepositoryFindQuery<Query, OrderByKeys, Id>,
            tsx,
          ).then(takeOnlyOne()),
        );
    const res = await resPromise;
    return res;
  }

  async fetchAll(ids: Id[], tx?: DrizzleTransaction): Promise<Model[]> {
    const resPromise = tx
      ? this.findImplementation(
          { id: ids } as BaseRepositoryFindQuery<Query, OrderByKeys, Id>,
          tx,
        ).then(takeAll(ids))
      : this.txManager.runInTransaction(async tsx =>
          this.findImplementation(
            { id: ids } as BaseRepositoryFindQuery<Query, OrderByKeys, Id>,
            tsx,
          ).then(takeAll(ids)),
        );
    const res = await resPromise;
    return res;
  }
}

// backlog
// 1. 테이블 필드 매핑 메서드 추가
// 2. tx 메서드들 impl로 바꾸고 각 ModelBase로 옮기기
// 3. update patch에 where clause 및 batch 추가
// 4. lock 시스템의 withTransaction 으로 변경
