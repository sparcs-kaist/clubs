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
} from "drizzle-orm";
import { MySqlColumn, MySqlTable } from "drizzle-orm/mysql-core";
import { MySql2Database } from "drizzle-orm/mysql2";

import { OperationType } from "@clubs/interface/common/utils/field-operations";

import {
  DrizzleAsyncProvider,
  DrizzleTransaction,
} from "@sparcs-clubs/api/drizzle/drizzle.provider";

import { OrderByTypeEnum } from "../enums";
import { IdType, MEntity } from "../model/entity.model";
import {
  getKSTDate,
  makeObjectPropsToDBTimezone,
  takeAll,
  takeOnlyOne,
} from "../util/util";

// 쿼리 조건 래핑을 위해 필요한 타입 선언
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
  "in",
  "isNotNull",
] as const;

// 타입으로 변환
type MysqlQueryConditionOperators =
  (typeof mysqlQueryConditionOperators)[number];

const nestedQueryWrapper = ["and", "or", "not"] as const;
type NestedQueryWrapper = (typeof nestedQueryWrapper)[number];

// Clubs에서 사용하는 테이블에 id와 deletedAt 필드가 항상 있음을 보장하기 위한 interface
interface TableWithIdAndDeletedAt {
  id: MySqlColumn<ColumnBaseConfig<ColumnDataType, string>>;
  deletedAt: MySqlColumn<ColumnBaseConfig<ColumnDataType, string | null>>;
}

// MEntity 의 static 메서드를 사용하기 위한 interface
// 베이스 레포지토리 추상클래스 한정으로, MEntity를 직접 주입을 안해서 이렇게 한번 매핑해줘야 static 메서드들을 사용할 수 있음
// 실제 repository 에서는 이 인터페이스를 사용 및 구현할 필요 없음
interface ModelWithMethods<
  Model extends MEntity<Id>,
  FromDb,
  Query,
  Id extends IdType = number,
> {
  modelName: string;
  from(result: FromDb): Model;
  fieldMap(field: keyof Query): MySqlColumn;
}

// 기본적인 쿼리 파라미터들
// id, ids, pagination, orderBy 등을 기본으로 지원하기 위함
export interface BaseQueryFields<Id extends IdType = number> {
  id?: Id;
  ids?: Id[];
  pagination?: {
    offset: number;
    itemCount: number;
  };
  orderBy?: Record<string, OrderByTypeEnum>;
}

// Query 에 쿼리 가능한 타입들을 명시하여 사용
export type BaseRepositoryQuery<
  Query,
  Id extends IdType = number,
> = BaseQueryFields<Id> & Partial<Query>;

// 베이스 레포지토리 추상클래스
// 사용 방법
// 1. Model에 모델 클래스 넣기
// 2. Table에 FromDB (InferSelectTable) 타입 넣기
// 3. 쿼리 조건 추가 (id 등 제외)
// 4. 추가 쿼리 조건이 있을 경우 specialKeys에 추가하여 makeWhereClause를 상속하여 구현
@Injectable()
export abstract class BaseRepository<
  Model extends MEntity<Id>,
  DbResult,
  Table extends MySqlTable & TableWithIdAndDeletedAt, // &TableWith~ 를 통해 테이블에 ID와 deletedAt 필드가 항상 있음을 보장
  Query,
  Id extends IdType = number,
> {
  @Inject(DrizzleAsyncProvider) protected db: MySql2Database;

  constructor(
    protected table: Table,
    protected modelClass: ModelWithMethods<Model, DbResult, Query, Id>, // 모델엔티티 넣으면 됨
  ) {}

  /* where 절을 생성하는 메서드
   * find와 count에서 사용
   * 상속할 떄 super.makeWhereClause(param, specialKeys) 로 기본적인 쿼리 생성 (id 등)
   * 추가적인 조건을 추가할 거면 specialKeys에 추가 (ex) duration ... )
   */
  protected makeWhereClause(
    param: BaseRepositoryQuery<Query, Id>,
    specialKeys?: string[], // 제외할 키들 ex) duration ...
  ): SQL[] {
    const whereClause: SQL[] = [];

    whereClause.push(isNull(this.table.deletedAt));

    // 기본 필터링: id와 ids
    if (param.id) {
      whereClause.push(eq(this.table.id, param.id));
    }
    if (param.ids) {
      whereClause.push(inArray(this.table.id, param.ids));
    }

    // Query 타입의 모든 키를 순회하면서 파라미터에 해당 값이 있는지 확인
    const defaultKeys = ["id", "ids", "pagination", "orderBy"];
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
              whereClause.push(inArray(tableField, value));
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
            } else {
              throw new Error(`Invalid key value: ${key} ${value}`);
            }
          }
        }
      });

    return whereClause;
  }

  // find, count는 왠만하면 makeWhereClause를 구현하면 처리 가능
  async findTx(
    tx: DrizzleTransaction,
    param: BaseRepositoryQuery<Query, Id>,
  ): Promise<Model[]> {
    let query = tx
      .select()
      .from(this.table)
      .where(and(...this.makeWhereClause(makeObjectPropsToDBTimezone(param))))
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

    return result.map(row => this.modelClass.from(row as DbResult));
  }

  async countTx(
    tx: DrizzleTransaction,
    param: BaseRepositoryQuery<Query, Id>,
  ): Promise<number> {
    const [result] = await tx
      .select({ count: count() })
      .from(this.table)
      .where(and(...this.makeWhereClause(makeObjectPropsToDBTimezone(param))));

    return result.count;
  }

  async createTx(
    tx: DrizzleTransaction,
    param: Partial<Model>,
  ): Promise<Model> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const modelInstance = new (this.modelClass as any)(param);

    const [result] = await tx
      .insert(this.table)
      .values(modelInstance.to(OperationType.CREATE) as Table["$inferInsert"])
      .execute();

    // insertId를 적절한 타입으로 변환
    const newId = result.insertId as Id;

    return this.fetchTx(tx, newId);
  }

  async putTx(
    tx: DrizzleTransaction,
    id: Id,
    param: Partial<Model>,
  ): Promise<Model> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const modelInstance = new (this.modelClass as any)(param);

    await tx
      .update(this.table)
      .set(modelInstance.to(OperationType.PUT) as Table["$inferInsert"])
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
      .set({ deletedAt: getKSTDate() })
      .where(eq(this.table.id, id))
      .execute();
  }

  // 상속 후에도 사용하는 헬퍼 메서드
  async withTransaction<Result>(
    callback: (tx: DrizzleTransaction) => Promise<Result>,
  ): Promise<Result> {
    return this.db.transaction(callback);
  }

  ///////////////////////////////////////////////////////////////////////////////
  // 이 아래는 바꿀 필요 없음
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

  private isNestedQueryWrapper(key: string): key is NestedQueryWrapper {
    return nestedQueryWrapper.includes(key as NestedQueryWrapper);
  }

  // 고급 연산자 처리 (gt, lt, gte, lte, like 등)
  protected processAdvancedOperators(
    queryField: keyof Query,
    conditions: Record<MysqlQueryConditionOperators, unknown>,
  ): SQL {
    // Query 필드를 테이블 필드로 변환
    const tableField = this.getTableField(queryField);
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
        case "in":
          if (Array.isArray(operand)) {
            whereClause.push(inArray(tableField, operand));
          }
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

  // Query 필드를 테이블 필드로 변환하는 헬퍼 메서드
  // abstract class의 한계로 인해 필요
  // 실제 구현 시에는 MEntity.fieldMap(queryField)를 사용하기에, 이 메서드는 사용하지 않음
  private getTableField(queryField: keyof Query): MySqlColumn {
    return this.modelClass.fieldMap(queryField);
  }

  // 재구현 필요 X인 부분들
  // TX 메서드만 구현하면 자동 반영

  async find(param: BaseRepositoryQuery<Query, Id>): Promise<Model[]> {
    return this.withTransaction(async tx => this.findTx(tx, param));
  }

  async count(param: BaseRepositoryQuery<Query, Id>): Promise<number> {
    return this.withTransaction(async tx => this.countTx(tx, param));
  }

  async create(param: Partial<Model>): Promise<Model> {
    return this.withTransaction(async tx => this.createTx(tx, param));
  }

  async put(id: Id, param: Partial<Model>): Promise<Model> {
    return this.withTransaction(async tx => this.putTx(tx, id, param));
  }

  async patch(oldId: Id, consumer: (oldbie: Model) => Model): Promise<Model> {
    return this.withTransaction(async tx => this.patchTx(tx, oldId, consumer));
  }

  async delete(id: Id): Promise<void> {
    return this.withTransaction(async tx => this.deleteTx(tx, id));
  }

  async fetchTx(tx: DrizzleTransaction, id: Id): Promise<Model> {
    const param = { id } as BaseRepositoryQuery<Query, Id>;
    return this.findTx(tx, param).then(
      takeOnlyOne<Model>(this.modelClass.modelName),
    );
  }

  // id(ids) 로 쿼리하는 함수들
  // 재구현 필요 X
  async fetch(id: Id): Promise<Model> {
    return this.withTransaction(async tx => this.fetchTx(tx, id));
  }

  async fetchAllTx(tx: DrizzleTransaction, ids: Id[]): Promise<Model[]> {
    const param = { ids } as BaseRepositoryQuery<Query, Id>;
    return this.findTx(tx, param).then(
      takeAll<Model, Id>(ids, this.modelClass.modelName),
    );
  }

  async fetchAll(ids: Id[]): Promise<Model[]> {
    return this.withTransaction(async tx => this.fetchAllTx(tx, ids));
  }
}
