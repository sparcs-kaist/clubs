import { Injectable } from "@nestjs/common";
import {
  and,
  count,
  eq,
  InferInsertModel,
  InferSelectModel,
  SQL,
  sql,
} from "drizzle-orm";

import { DrizzleTransaction } from "@sparcs-clubs/api/drizzle/drizzle.provider";

import { IdType, MEntity, ModelPatchFunction } from "../base/entity.model";
import { getDeletedAtObject } from "../util/util";
import {
  BaseRepository,
  BaseRepositoryFindQuery,
  BaseRepositoryQuery,
  BaseTableFieldMapKeys,
  InferUpdateModel,
  ModelConstructor,
  PlainObject,
  TableWithID,
} from "./base.repository";

type SelectModel<Table extends TableWithID> = InferSelectModel<Table>;
type InsertModel<Table extends TableWithID> = InferInsertModel<Table>;
type UpdateModel<Table extends TableWithID> = InferUpdateModel<Table>;

///////////////////////////////////////////////////////////////////////////////
// 베이스 레포지토리 추상클래스
// 사용 방법
// 1. Model에 모델 클래스 넣기
// 2. Table에 FromDB (InferSelectTable) 타입 넣기
// 3. 쿼리 조건 추가 (id 등 제외)
// 4. 추가 쿼리 조건이 있을 경우 specialKeys에 추가하여 makeWhereClause를 상속하여 구현
@Injectable()
export abstract class BaseSingleTableRepository<
  Model extends MEntity<Id> & IModelCreate,
  IModelCreate, // single table 에서는 IModelCreate == InsertModel<Table> 을 보장
  Table extends TableWithID, // &TableWith~ 를 통해 테이블에 ID와 deletedAt 필드가 항상 있음을 보장
  Query extends PlainObject,
  OrderByKeys extends string = "id", // 정렬에 사용되는 필드들
  QuerySupport extends PlainObject = {}, // 직접 쿼리는 안되지만, 쿼리 조건에 보조로 들어가는 필드들. ex) startTerm & EndTerm for duration and date
  Id extends IdType = number,
> extends BaseRepository<
  Model,
  IModelCreate,
  SelectModel<Table>,
  InsertModel<Table>,
  UpdateModel<Table>,
  Query,
  OrderByKeys,
  QuerySupport,
  Id
> {
  constructor(
    protected table: Table,
    protected readonly modelConstructor: ModelConstructor<Model, Id>, // 모델엔티티 넣으면 됨
  ) {
    super(modelConstructor, table);
  }

  /**
   * @description DB -> Model
   * @description DB Result를 Model 인스턴스로 변환하는 작업
   * @description find에서 사용
   */
  protected abstract dbToModelMapping(result: SelectModel<Table>): Model;

  /**
   * @description Model -> DB
   * @description Model 인스턴스를 DB에 저장할 수 있는 형태로 변환하는 작업
   * @description update에서 사용
   */
  protected abstract modelToDBMapping(model: Model): UpdateModel<Table>;

  /**
   * @description ModelCreate -> DB
   * @description ModelCreate 인스턴스를 DB에 저장할 수 있는 형태로 변환하는 작업
   * @description create에서 사용
   */
  protected abstract createToDBMapping(model: IModelCreate): InsertModel<Table>;

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

  // find, count는 왠만하면 makeWhereClause를 구현하면 처리 가능
  protected async findImplementation(
    query: BaseRepositoryFindQuery<Query, OrderByKeys, Id>,
    tx: DrizzleTransaction,
  ): Promise<Model[]> {
    let selectQuery = tx
      .select()
      .from(this.table)
      .where(this.makeWhereClause(query))
      .$dynamic();

    if (query.pagination) {
      selectQuery = selectQuery.limit(query.pagination.itemCount);
      selectQuery = selectQuery.offset(
        (query.pagination.offset - 1) * query.pagination.itemCount,
      );
    }

    if (query.orderBy) {
      selectQuery = selectQuery.orderBy(...this.makeOrderBy(query.orderBy));
    }

    const result = await selectQuery.execute();
    const ret = result.map(row => this.dbToModel(row));
    return ret;
  }

  protected async countImplementation(
    query: BaseRepositoryQuery<Query, Id>,
    tx: DrizzleTransaction,
  ): Promise<number> {
    const [result] = await tx
      .select({ count: count() })
      .from(this.table)
      .where(this.makeWhereClause(query));

    return result.count;
  }

  protected async createImplementation(
    data: IModelCreate[],
    tx: DrizzleTransaction,
  ): Promise<Model[]> {
    const dbData = data.map(d => this.createToDB(d));
    // TODO: bulk로 보내고 $returningId로 동작하게 수정
    // 참고: https://orm.drizzle.team/docs/insert insert $returningId part
    // 원래 계획: $returningId를 사용해 insertIds를 이용해서 한번에 넣고 한번에 다시 쿼리
    // 아래 코드는 작동하나, drizzle 0.32 (returningId가 생긴 버전) 에서는 strictNullChecks가 true 여야 작동하는 버그가 존재함.
    // 나중에 strictNullChecks가 true 인 버전으로 바꾼 후 변경 필요
    // const insert = await tx.insert(this.table).values(data).$returningId();

    // if (!Array.isArray(insert)) {
    //   throw new Error(`insert is not an array : ${JSON.stringify(insert)}`);
    // }

    // const ids = insert.map(idObject => idObject.id) as Id[];
    //지금은 returningId가 제네릭에서 인식이 안돼서 이렇게 하나씩 넣고 쿼리
    // 참고: base.repository.ts 의 TableWithID 위 주석처리 부분

    const ids = await Promise.all(
      dbData.map(async d => {
        const [result] = await tx.insert(this.table).values(d);
        return result.insertId as Id;
      }),
    );

    const results = await this.fetchAll(ids, tx);

    return results;
  }

  protected async putImplementation(
    model: Model,
    tx: DrizzleTransaction,
  ): Promise<Model> {
    const data = this.modelToDB(model);
    await tx
      .update(this.table)
      .set(data as Record<string, unknown>)
      .where(eq(this.table.id, model.id))
      .execute();

    return this.fetch(model.id, tx);
  }

  protected async patchImplementation(
    query: BaseRepositoryQuery<Query, Id>,
    patchFunction: ModelPatchFunction<Model, Id>,
    tx: DrizzleTransaction,
  ): Promise<Model[]> {
    const data = await this.find(query, tx);
    const updated = data.map(patchFunction);
    const result = await Promise.all(
      updated.map(model => this.putImplementation(model, tx)),
    );
    return result;
  }

  protected async deleteImplementation(
    query: BaseRepositoryQuery<Query, Id>,
    tx: DrizzleTransaction,
  ): Promise<boolean> {
    await tx
      .update(this.table)
      .set(getDeletedAtObject())
      .where(this.makeWhereClause(query))
      .execute();
    return true;
  }

  /**
   * @description 락을 잡는 쿼리를 실행하는 메서드
   * @description Single 테이블일 때랑 멀티 테이블일 때랑 구현이 다르기에, BaseRepository에서 구현해야 함
   */
  protected async executeLockQuery(
    tx: DrizzleTransaction,
    query: BaseRepositoryQuery<Query, Id>,
    lockSql: string,
  ): Promise<void> {
    const where = and(this.makeWhereClause(query));
    await tx.execute(
      sql`SELECT 1 FROM ${this.table} WHERE ${where} ${sql.raw(lockSql)}`,
    );
  }

  /**
   * @override SpecialCondition 이 존재할 때 구현해야 함
   * @description 특수한 조건을 처리하는 메서드
   * @description 모델 필드에는 없는 조건으로 처리하고자 할 때 구현하기
   * @description 여기에 속하는 필드는 fieldMap에서 null로 처리되어야 함
   * @description 예시: duration, date 등
   * @description value의 타입은 상속할때 명시할 것
   * @description 예시: { duration: { startTerm: new Date(), endTerm: new Date() } }, {date: new Date("2025-04-18T00:00:00.000Z")}
   */
  protected processSpecialCondition(
    key: BaseTableFieldMapKeys<Query, OrderByKeys, QuerySupport>,
    value: unknown,
  ): SQL {
    throw new Error(`Invalid special condition: ${String(key)} ${value}`);
  }
}
