import { Inject, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "@sparcs-clubs/api/prisma/prisma.service";

import { IdType, MEntity, ModelPatchFunction } from "../base/entity.model";
import { CLOCK, Clock } from "../clock/clock";
import { OrderByTypeEnum } from "../enums";
import { takeAll, takeOnlyOne } from "../util/util";

// 순수 plain object인 타입을 나타내는 타입
export type PlainObject = Record<string, unknown>;

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

// Query에 대해 Id Field를 확장.
type BaseQuery<Query extends PlainObject, Id extends IdType = number> = Omit<
  Query,
  "id"
> & {
  id: AdvancedQueryValueTypes<Id>;
};

// 필드 타입을 배열 및 복합쿼리로 확장
type AdvancedQueryValueTypes<T> =
  | T
  | T[]
  | Partial<Record<MysqlQueryConditionOperators, T>>;

// 주어진 Query Object의 필드 타입을 배열 및 복합쿼리로 확장
type AdvancedQuery<Query extends PlainObject> = {
  [K in keyof Query]?: AdvancedQueryValueTypes<Query[K]>;
};

// processAdvancedOperators의 param 타입
type AdvancedConditionalValue<T extends PrimitiveConditionValue> = Partial<
  Record<MysqlQueryConditionOperators, T>
>;

// 중첩 쿼리 타입
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

// 기본 레포지토리 메서드 파라미터 쿼리
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

// 테이블 칼럼 <-> 모델 필드 매핑 필드 키 타입
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

// Prisma transaction client type
export type PrismaTransactionClient = Prisma.TransactionClient;

///////////////////////////////////////////////////////////////////////////////
// MEntity 의 생성자
export interface ModelConstructor<
  Model extends MEntity<Id>,
  Id extends IdType,
> {
  modelName: string;
  new (entity: Model): Model;
}

///////////////////////////////////////////////////////////////////////////////
// 베이스 레포지토리 추상클래스 (Prisma version)
//
// Prisma에서는 timezone 보정이 PrismaService 미들웨어에서 자동으로 처리되므로,
// dbToModel/modelToDB에서 수동 timezone 보정이 필요 없음.
//
// 사용 방법:
// 1. Model에 모델 클래스 넣기
// 2. prismaModelName에 Prisma 모델 이름 (소문자 시작) 넣기
// 3. 쿼리 조건 추가 (id 등 제외)
// 4. 추가 쿼리 조건이 있을 경우 processSpecialCondition를 상속하여 구현
@Injectable()
export abstract class BaseRepository<
  Model extends MEntity<Id> & IModelCreate,
  IModelCreate,
  DbSelect,
  DbInsert,
  DbUpdate,
  Query extends PlainObject,
  OrderByKeys extends string = "id",
  QuerySupport extends PlainObject = {},
  Id extends IdType = number,
> {
  @Inject(PrismaService) protected prisma: PrismaService;

  @Inject(CLOCK) protected clock: Clock;

  constructor(
    protected readonly mainModelConstructor: ModelConstructor<Model, Id>,
    protected readonly prismaModelName: string, // e.g. "fundingFeedback", "division", "professor"
  ) {}

  // Prisma delegate accessor (dynamic model access)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected getDelegate(tx?: PrismaTransactionClient): any {
    const client = tx || this.prisma;
    return client[this.prismaModelName];
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
   * @description 주어진 필드 이름에 대응하는 Prisma 필드 이름을 반환
   * @description 기존 Drizzle fieldMap의 역할을 대체
   * @returns Prisma 필드 이름 string (일반 필드)
   * @returns null (특수 조건 필드 — processSpecialCondition에서 처리)
   * @returns undefined (존재하지 않는 필드)
   */
  protected abstract fieldMap(
    field: BaseTableFieldMapKeys<Query, OrderByKeys, QuerySupport>,
  ): string | null | undefined;

  /**
   * @description 특수한 조건을 처리하는 메서드
   * @description 모델 필드에는 없는 조건으로 처리하고자 할 때 구현
   * @description fieldMap에서 null로 처리되어야 함
   * @returns Prisma where 조건 object
   */
  protected abstract processSpecialCondition(
    key: BaseTableFieldMapKeys<Query, OrderByKeys, QuerySupport>,
    value: PrimitiveConditionValue, // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Record<string, any>;

  ///////////////////////////////////////////////////////////////////////////////
  // db <-> model 매핑 메서드
  // Prisma 미들웨어가 timezone을 자동 처리하므로, 수동 변환이 필요 없음

  protected dbToModel(result: DbSelect): Model {
    return this.dbToModelMapping(result);
  }

  protected modelToDB(model: Model): DbUpdate {
    return this.modelToDBMapping(model);
  }

  protected createToDB(model: IModelCreate): DbInsert {
    return this.createToDBMapping(model);
  }

  ///////////////////////////////////////////////////////////////////////////////
  // where 절 생성 관련 메서드들

  /**
   * @description Prisma where 절을 생성하는 메서드
   * @description 쿼리 객체를 Prisma의 where 형식으로 변환
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected makeWhereClause(query: BaseRepositoryQuery<Query, Id>): any {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const conditions: any[] = [];

    // 기본 soft delete 조건
    conditions.push({ deletedAt: null });

    const defaultKeys = ["pagination", "orderBy"];

    Object.entries(query)
      .filter(([key, _]) => !defaultKeys.includes(key))
      .forEach(([key, value]) => {
        const processedQuery = this.processQuery(
          key,
          value as BaseWhereQuery<Query, QuerySupport, Id>,
        );
        if (processedQuery !== undefined) {
          conditions.push(processedQuery);
        }
      });

    return conditions.length > 1
      ? { AND: conditions }
      : conditions[0] || { deletedAt: null };
  }

  /**
   * @description Prisma orderBy 절을 생성하는 메서드
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected makeOrderBy(order: OrderByQuery<OrderByKeys>): any[] {
    return Object.entries(order).map(([field, direction]) => {
      const prismaField = this.getPrismaField(field as keyof Query);
      if (prismaField === null) {
        throw new Error(`Invalid order field for special condition: ${field}`);
      }
      return {
        [prismaField]: direction === OrderByTypeEnum.ASC ? "asc" : "desc",
      };
    });
  }

  private getPrismaField(
    field: BaseTableFieldMapKeys<Query, OrderByKeys, QuerySupport>,
  ): string | null {
    const mapped = this.fieldMap(field);
    if (mapped === undefined) {
      throw new Error(`Invalid field: ${String(field)}`);
    }
    return mapped;
  }

  private processQuery(
    key: string,
    value: unknown,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): any {
    if (value === undefined) {
      return undefined;
    }
    if (this.isNestedQueryWrapper(key)) {
      return this.processNestedQuery(
        key as NestedQueryWrappingOperators,
        value as BaseWhereQuery<Query, QuerySupport, Id>,
      );
    }
    if (this.isPrimitiveCondition(value)) {
      return this.processPrimitiveCondition(
        key as BaseWhereQueryKeys<Query, QuerySupport, Id>,
        value as PrimitiveConditionValue,
      );
    }
    if (this.isAdvancedCondition(value)) {
      return this.processAdvancedCondition(
        key as BaseWhereQueryKeys<Query, QuerySupport, Id>,
        value as AdvancedConditionalValue<PrimitiveConditionValue>,
      );
    }
    throw new Error(`Invalid condition: ${String(key)} ${value}`);
  }

  private processNestedQuery(
    wrapper: NestedQueryWrappingOperators,
    conditions: BaseWhereQuery<Query, QuerySupport, Id>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): any {
    if (conditions === undefined) {
      return undefined;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereConditions = Object.entries(conditions).reduce<any[]>(
      (acc, [key, value]) => {
        const processedQuery = this.processQuery(key, value);
        if (processedQuery !== undefined) {
          acc.push(processedQuery);
        }
        return acc;
      },
      [],
    );
    if (whereConditions.length === 0) {
      throw new Error(`Where clause is empty for conditions: ${conditions}`);
    }
    if (wrapper === "and") {
      return { AND: whereConditions };
    }
    if (wrapper === "or") {
      return { OR: whereConditions };
    }
    if (wrapper === "not") {
      if (whereConditions.length !== 1) {
        throw new Error(
          `Not operator can only be used with a single condition: ${conditions}`,
        );
      }
      return { NOT: whereConditions[0] };
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
   * @description 단순 조건 (eq, inArray, null) 을 Prisma where로 변환
   */
  private processPrimitiveCondition(
    key: BaseWhereQueryKeys<Query, QuerySupport, Id>,
    value: PrimitiveConditionValue,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): any {
    const prismaField = this.getPrismaField(key);
    if (prismaField === null) {
      // special condition
      return this.processSpecialCondition(key, value);
    }
    if (Array.isArray(value)) {
      if (value.length === 0) {
        throw new Error(`Value Array is empty: ${String(key)} ${value}`);
      }
      return { [prismaField]: { in: value } };
    }
    if (value === null) {
      return { [prismaField]: null };
    }
    // Date, boolean, number, string -> equals
    return { [prismaField]: value };
  }

  private isPrimitiveCondition(
    value: unknown,
  ): value is PrimitiveConditionValue {
    return (
      Array.isArray(value) ||
      value === null ||
      value instanceof Date ||
      typeof value === "boolean" ||
      typeof value === "number" ||
      typeof value === "string"
    );
  }

  /**
   * @description 고급 연산자 오브젝트를 Prisma where로 변환
   */
  private processAdvancedCondition<T extends PrimitiveConditionValue>(
    queryField: BaseWhereQueryKeys<Query, QuerySupport, Id>,
    conditions: AdvancedConditionalValue<T>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): any {
    const prismaField = this.getPrismaField(queryField);
    if (prismaField === null) {
      throw new Error(
        `Special condition should be used in only primitive way!: ${String(queryField)}`,
      );
    }

    if (Object.keys(conditions).length === 0) {
      throw new Error(`Empty conditions: ${String(conditions)}`);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prismaCondition: Record<string, any> = {};

    Object.entries(conditions).forEach(([operator, operand]) => {
      if (operand === undefined || operand === null) {
        throw new Error(`Invalid operand: ${operand}`);
      }
      switch (operator) {
        case "eq":
          prismaCondition.equals = operand;
          break;
        case "ne":
          prismaCondition.not = operand;
          break;
        case "gt":
          prismaCondition.gt = operand;
          break;
        case "gte":
          prismaCondition.gte = operand;
          break;
        case "lt":
          prismaCondition.lt = operand;
          break;
        case "lte":
          prismaCondition.lte = operand;
          break;
        case "isNotNull":
          prismaCondition.not = null;
          break;
        case "between":
          if (!Array.isArray(operand) || operand.length !== 2) {
            throw new Error(
              `Invalid operator and operand for between: ${prismaField} ${operand}`,
            );
          }
          [prismaCondition.gte] = operand;
          [, prismaCondition.lte] = operand;
          break;
        case "like":
          prismaCondition.contains = String(operand);
          break;
        case "startsWith":
          prismaCondition.startsWith = String(operand);
          break;
        case "endsWith":
          prismaCondition.endsWith = String(operand);
          break;
        default:
          throw new Error(`Invalid operator: ${operator}`);
      }
    });

    return { [prismaField]: prismaCondition };
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

  ///////////////////////////////////////////////////////////////////////////////
  // 트랜잭션 관련

  /**
   * @description Prisma interactive transaction을 실행
   */
  async runInTransaction<R>(
    fn: (tx: PrismaTransactionClient) => Promise<R>,
  ): Promise<R> {
    return this.prisma.$transaction(fn);
  }

  ///////////////////////////////////////////////////////////////////////////////
  // 락 관련 메서드 (Prisma raw query로 구현)

  async acquireLock(
    tx: PrismaTransactionClient,
    query: BaseRepositoryQuery<Query, Id>,
    mode: "update" | "read" = "update",
  ): Promise<void> {
    const lockSql = mode === "read" ? "LOCK IN SHARE MODE" : "FOR UPDATE";
    await this.executeLockQuery(tx, query, lockSql);
  }

  protected abstract executeLockQuery(
    tx: PrismaTransactionClient,
    query: BaseRepositoryQuery<Query, Id>,
    lockSql: string,
  ): Promise<void>;

  ///////////////////////////////////////////////////////////////////////////////
  // CRUD 메서드들 - abstract implementation 패턴

  protected abstract findImplementation(
    query: BaseRepositoryFindQuery<Query, OrderByKeys, Id>,
    tx: PrismaTransactionClient,
  ): Promise<Model[]>;

  protected abstract countImplementation(
    query: BaseRepositoryQuery<Query, Id>,
    tx: PrismaTransactionClient,
  ): Promise<number>;

  protected abstract createImplementation(
    data: IModelCreate[],
    tx: PrismaTransactionClient,
  ): Promise<Model[]>;

  protected abstract putImplementation(
    model: Model,
    tx: PrismaTransactionClient,
  ): Promise<Model>;

  protected abstract patchImplementation(
    query: BaseRepositoryQuery<Query, Id>,
    patchFunction: ModelPatchFunction<Model, Id>,
    tx: PrismaTransactionClient,
  ): Promise<Model[]>;

  protected abstract deleteImplementation(
    query: BaseRepositoryQuery<Query, Id>,
    tx: PrismaTransactionClient,
  ): Promise<boolean>;

  ///////////////////////////////////////////////////////////////////////////////
  // Public API 메서드들
  // TX가 있으면 TX 안에서, 없으면 새 transaction 안에서 실행

  async find(
    query: BaseRepositoryFindQuery<Query, OrderByKeys, Id>,
    tx?: PrismaTransactionClient,
  ): Promise<Model[]> {
    const resPromise = tx
      ? this.findImplementation(query, tx)
      : this.runInTransaction(tsx => this.findImplementation(query, tsx));
    return resPromise;
  }

  async count(
    query: BaseRepositoryQuery<Query, Id>,
    tx?: PrismaTransactionClient,
  ): Promise<number> {
    const resPromise = tx
      ? this.countImplementation(query, tx)
      : this.runInTransaction(tsx => this.countImplementation(query, tsx));
    return resPromise;
  }

  async create(
    data: IModelCreate[] | IModelCreate,
    tx?: PrismaTransactionClient,
  ): Promise<Model[]> {
    const insertData = Array.isArray(data) ? data : [data];
    const resPromise = tx
      ? this.createImplementation(insertData, tx)
      : this.runInTransaction(tsx =>
          this.createImplementation(insertData, tsx),
        );
    return resPromise;
  }

  async put(model: Model, tx?: PrismaTransactionClient): Promise<Model> {
    const resPromise = tx
      ? this.putImplementation(model, tx)
      : this.runInTransaction(tsx => this.putImplementation(model, tsx));
    return resPromise;
  }

  async patch(
    query: BaseRepositoryQuery<Query, Id>,
    patchFunction: ModelPatchFunction<Model, Id>,
    tx?: PrismaTransactionClient,
  ): Promise<Model[]> {
    const resPromise = tx
      ? this.patchImplementation(query, patchFunction, tx)
      : this.runInTransaction(tsx =>
          this.patchImplementation(query, patchFunction, tsx),
        );
    return resPromise;
  }

  async delete(
    query: BaseRepositoryQuery<Query, Id>,
    tx?: PrismaTransactionClient,
  ): Promise<boolean> {
    const resPromise = tx
      ? this.deleteImplementation(query, tx)
      : this.runInTransaction(tsx => this.deleteImplementation(query, tsx));
    return resPromise;
  }

  async fetch(id: Id, tx?: PrismaTransactionClient): Promise<Model> {
    const resPromise = tx
      ? this.find(
          { id } as BaseRepositoryFindQuery<Query, OrderByKeys, Id>,
          tx,
        ).then(takeOnlyOne(this.mainModelConstructor.modelName))
      : this.runInTransaction(tsx =>
          this.find(
            { id } as BaseRepositoryFindQuery<Query, OrderByKeys, Id>,
            tsx,
          ).then(takeOnlyOne(this.mainModelConstructor.modelName)),
        );
    return resPromise;
  }

  async fetchAll(ids: Id[], tx?: PrismaTransactionClient): Promise<Model[]> {
    const reducedIds = Array.from(new Set(ids)).filter(
      (id): id is Id => id != null,
    );
    if (reducedIds.length === 0) return [];
    const resPromise = tx
      ? this.find(
          { id: reducedIds } as BaseRepositoryFindQuery<Query, OrderByKeys, Id>,
          tx,
        ).then(takeAll(reducedIds, this.mainModelConstructor.modelName))
      : this.runInTransaction(tsx =>
          this.find(
            { id: reducedIds } as BaseRepositoryFindQuery<
              Query,
              OrderByKeys,
              Id
            >,
            tsx,
          ).then(takeAll(reducedIds, this.mainModelConstructor.modelName)),
        );
    return resPromise;
  }
}
