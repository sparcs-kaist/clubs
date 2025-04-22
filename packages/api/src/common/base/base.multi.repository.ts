import { Injectable } from "@nestjs/common";
import {
  eq,
  inArray,
  InferInsertModel,
  InferSelectModel,
  SQL,
  sql,
} from "drizzle-orm";

import { DrizzleTransaction } from "@sparcs-clubs/api/drizzle/drizzle.provider";

import { IdType, IEntity, MEntity } from "../base/entity.model";
import { forEachAsyncSequentially, getDeletedAtObject } from "../util/util";
import {
  BaseRepository,
  BaseRepositoryFindQuery,
  BaseRepositoryQuery,
  BaseTableFieldMapKeys,
  ModelConstructor,
  MultiTableWithID,
  PlainObject,
  TableWithID,
} from "./base.repository";

type InferUpdateModel<Table extends TableWithID> = Partial<
  InferSelectModel<Table>
>;

type TableToInfer<
  Table extends TableWithID,
  Mode extends "select" | "insert" | "update",
> = Mode extends "select"
  ? InferSelectModel<Table>
  : Mode extends "insert"
    ? InferInsertModel<Table>
    : InferUpdateModel<Table>;

type TableToInferArray<
  Table extends TableWithID,
  Mode extends "select" | "insert" | "update",
> = Mode extends "select"
  ? InferSelectModel<Table>[]
  : Mode extends "insert"
    ? InferInsertModel<Table>[]
    : InferUpdateModel<Table>[];

type RecordToInferOne<
  R extends Record<string, TableWithID>,
  Mode extends "select" | "insert" | "update",
> = {
  [key in keyof R]: Mode extends "select"
    ? InferSelectModel<R[key]>
    : Mode extends "insert"
      ? InferInsertModel<R[key]>
      : InferUpdateModel<R[key]>;
};

type RecordToInferMany<
  R extends Record<string, TableWithID>,
  Mode extends "select" | "insert" | "update",
> = {
  [key in keyof R]: Mode extends "select"
    ? InferSelectModel<R[key]>[]
    : Mode extends "insert"
      ? InferInsertModel<R[key]>[]
      : InferUpdateModel<R[key]>[];
};

type MultiTableInfer<
  MultiTable extends MultiTableWithID,
  Mode extends "select" | "insert" | "update",
> = {
  main: TableToInfer<MultiTable["main"], Mode>;
  oneToOne: RecordToInferOne<MultiTable["oneToOne"], Mode>;
  oneToMany: RecordToInferMany<MultiTable["oneToMany"], Mode>;
};

// 모델을 테이블로 변환한 상태

export type MultiSelectModel<MultiTable extends MultiTableWithID> =
  MultiTableInfer<MultiTable, "select">;

export type MultiInsertModel<MultiTable extends MultiTableWithID> =
  MultiTableInfer<MultiTable, "insert">;

export type MultiUpdateModel<MultiTable extends MultiTableWithID> =
  MultiTableInfer<MultiTable, "update">;

// DB에 넣기 직전 상태
export type MultiModelSelectTableArray<MultiTable extends MultiTableWithID> = {
  main: TableToInferArray<MultiTable["main"], "select">;
  oneToOne: {
    [K in keyof MultiTable["oneToOne"]]: TableToInferArray<
      MultiTable["oneToOne"][K],
      "select"
    >;
  };
  oneToMany: {
    [K in keyof MultiTable["oneToMany"]]: TableToInferArray<
      MultiTable["oneToMany"][K],
      "select"
    >;
  };
};

export type MultiModelInsertTableArray<MultiTable extends MultiTableWithID> = {
  main: TableToInferArray<MultiTable["main"], "insert">;
  oneToOne: {
    [K in keyof MultiTable["oneToOne"]]: TableToInferArray<
      MultiTable["oneToOne"][K],
      "insert"
    >;
  };
  oneToMany: {
    [K in keyof MultiTable["oneToMany"]]: TableToInferArray<
      MultiTable["oneToMany"][K],
      "insert"
    >;
  };
};

///////////////////////////////////////////////////////////////////////////////
// 베이스 레포지토리 추상클래스
// 사용 방법
// 1. Model에 모델 클래스 넣기
// 2. Table에 FromDB (InferSelectTable) 타입 넣기
// 3. 쿼리 조건 추가 (id 등 제외)
// 4. 추가 쿼리 조건이 있을 경우 specialKeys에 추가하여 makeWhereClause를 상속하여 구현
@Injectable()
export abstract class BaseMultiTableRepository<
  Model extends MEntity<IModel, Id>,
  IModel extends IEntity<Id>,
  Table extends MultiTableWithID, // &TableWith~ 를 통해 테이블에 ID와 deletedAt 필드가 항상 있음을 보장
  Query extends PlainObject,
  OrderByKeys extends string = "id", // 정렬에 사용되는 필드들
  QuerySupport extends PlainObject = {}, // 직접 쿼리는 안되지만, 쿼리 조건에 보조로 들어가는 필드들. ex) startTerm & EndTerm for duration and date
  Id extends IdType = number,
> extends BaseRepository<
  Model,
  IModel,
  MultiSelectModel<Table>,
  MultiInsertModel<Table>,
  MultiUpdateModel<Table>,
  Query,
  OrderByKeys,
  QuerySupport,
  Id
> {
  constructor(
    protected table: Table,
    protected readonly modelConstructor: ModelConstructor<Model, IModel, Id>, // 모델엔티티 넣으면 됨
    protected readonly mainTableIdName: string, // 서브 테이블에서 메인 테이블을 나타내는 id. ex) activityId
  ) {
    super(modelConstructor, table);
  }

  /**
   * @description DB -> Model
   * @description DB Result를 Model 인스턴스로 변환하는 작업
   * @description find에서 사용
   */
  protected abstract dbToModelMapping(result: MultiSelectModel<Table>): Model;

  /**
   * @description Model -> DB
   * @description Model 인스턴스를 DB에 저장할 수 있는 형태로 변환하는 작업
   * @description update에서 사용
   */
  protected abstract modelToDBMapping(model: Model): MultiUpdateModel<Table>;

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
    const mainIds = await this.fetchMainTableIds(query, tx);
    if (mainIds.length === 0) return [];

    const main = await tx
      .select()
      .from(this.table.main)
      .where(inArray(this.table.main.id, mainIds))
      .execute();

    const oneToOneMapEntries = await Promise.all(
      Object.entries(this.table.oneToOne).map(async ([key, table]) => {
        const rows = await tx
          .select()
          .from(table)
          .where(inArray(table[this.mainTableIdName], mainIds))
          .execute();
        return [key, rows];
      }),
    );
    const oneToOne = Object.fromEntries(oneToOneMapEntries);

    const oneToManyMapEntries = await Promise.all(
      Object.entries(this.table.oneToMany).map(async ([key, table]) => {
        const rows = await tx
          .select()
          .from(table)
          .where(inArray(table[this.mainTableIdName], mainIds))
          .execute();
        return [key, rows];
      }),
    );
    const oneToMany = Object.fromEntries(oneToManyMapEntries);
    const dbSelect = this.selectTableArrayResultToModelArray({
      main,
      oneToOne,
      oneToMany,
    } as MultiModelSelectTableArray<Table>) as MultiSelectModel<Table>[];

    return dbSelect.map(row => this.dbToModel(row));
  }

  protected async countImplementation(
    query: BaseRepositoryQuery<Query, Id>,
    tx: DrizzleTransaction,
  ): Promise<number> {
    const mainIds = await this.fetchMainTableIds(query, tx);
    return mainIds.length;
  }

  protected async createImplementation(
    data: MultiInsertModel<Table>[],
    tx: DrizzleTransaction,
  ): Promise<Model[]> {
    // 메인 테이블 삽입
    const processedData = await Promise.all(
      data.map(async model => {
        const [result] = await tx.insert(this.table.main).values(model.main);
        const id = result.insertId;
        return { ...model, id } as MultiInsertModel<Table> & { id: Id };
      }),
    );

    if (!Array.isArray(processedData)) {
      throw new Error(
        `processedData is not an array : ${JSON.stringify(processedData)}`,
      );
    }

    if (processedData.length !== data.length) {
      throw new Error(
        `processedData length is not equal to data length : ${processedData.length} !== ${data.length}, ${JSON.stringify(processedData)}`,
      );
    }

    const arrayData = this.insertModelArrayToTableArrayResult(processedData);

    // 메인 테이블 id를 기반으로 서브 테이블 삽입
    // problem: 서브 테이블 삽입 시 메인 테이블 id를 알 수 없음

    await Promise.all(
      Object.entries(this.table.oneToOne).map(async ([key, table]) => {
        await tx.insert(table).values(arrayData.oneToOne[key]);
      }),
    );

    await Promise.all(
      Object.entries(this.table.oneToMany).map(async ([key, table]) => {
        await tx.insert(table).values(arrayData.oneToMany[key]);
      }),
    );

    // insert 한 결과 반환
    const results = await this.fetchAll(
      processedData.map(m => m.id),
      tx,
    );

    return results;
  }

  protected async putImplementation(
    model: Model,
    tx: DrizzleTransaction,
  ): Promise<Model> {
    const data = this.modelToDB(model);
    // main 업데이트
    await tx
      .update(this.table.main)
      .set(data)
      .where(eq(this.table.main.id, model.id));

    // oneToOne 업데이트
    await Promise.all(
      Object.entries(data.oneToOne).map(([key, table]) =>
        tx
          .update(table)
          .set(data.oneToOne[key])
          .where(eq(table[this.mainTableIdName], model.id)),
      ),
    );

    // oneToMany 업데이트: delete and insert
    await Promise.all(
      Object.entries(this.table.oneToMany).map(async ([key, table]) => {
        await tx
          .update(table)
          .set(getDeletedAtObject())
          .where(eq(table[this.mainTableIdName], model.id));

        await tx.insert(table).values(data.oneToMany[key]);
      }),
    );

    return this.fetch(model.id, tx);
  }

  protected async patchImplementation(
    query: BaseRepositoryQuery<Query, Id>,
    consumer: (original: Model) => Model,
    tx: DrizzleTransaction,
  ): Promise<Model[]> {
    const data = await this.find(query, tx);
    const updated = data.map(consumer);

    const result = await Promise.all(
      updated.map(model => this.putImplementation(model, tx)),
    );

    return result;
  }

  protected async deleteImplementation(
    query: BaseRepositoryQuery<Query, Id>,
    tx: DrizzleTransaction,
  ): Promise<boolean> {
    const mainIds = await this.fetchMainTableIds(query, tx);

    // main 업데이트
    await tx
      .update(this.table.main)
      .set(getDeletedAtObject())
      .where(inArray(this.table.main.id, mainIds));

    // oneToOne 업데이트
    await Promise.all(
      Object.values(this.table.oneToOne).map(table =>
        tx
          .update(table)
          .set(getDeletedAtObject())
          .where(eq(table[this.mainTableIdName], mainIds)),
      ),
    );

    // oneToMany 업데이트: delete and insert
    await Promise.all(
      Object.values(this.table.oneToMany).map(async table => {
        await tx
          .update(table)
          .set(getDeletedAtObject())
          .where(eq(table[this.mainTableIdName], mainIds));
      }),
    );
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
    const mainIds = await this.fetchMainTableIds(query, tx);

    await tx.execute(
      sql`SELECT 1 FROM ${this.table.main} WHERE ${inArray(
        this.table.main.id,
        mainIds,
      )} ${sql.raw(lockSql)}`,
    );

    await forEachAsyncSequentially(
      [
        ...Object.values(this.table.oneToOne),
        ...Object.values(this.table.oneToMany),
      ],
      async table => {
        await tx.execute(
          sql`SELECT 1 FROM ${table} WHERE ${inArray(
            table[this.mainTableIdName],
            mainIds,
          )} ${sql.raw(lockSql)}`,
        );
      },
    );
  }

  private async fetchMainTableIds(
    query: BaseRepositoryFindQuery<Query, OrderByKeys, Id>,
    tx: DrizzleTransaction,
  ): Promise<Id[]> {
    if (Object.keys(query).length === 1 && query.id) {
      return Array.isArray(query.id) ? (query.id as Id[]) : [query.id as Id];
    }

    let selectIdQuery = tx
      .selectDistinct({ id: this.table.main.id })
      .from(this.table.main)
      .$dynamic();
    [
      ...Object.values(this.table.oneToOne),
      ...Object.values(this.table.oneToMany),
    ].forEach(table => {
      selectIdQuery = selectIdQuery.leftJoin(
        table,
        eq(this.table.main.id, table[this.mainTableIdName]),
      );
    });

    const distinctIdResult = await selectIdQuery.execute();

    const queryIds = distinctIdResult.map(r => r.id as Id);

    let selectQuery = tx
      .select()
      .from(this.table.main)
      .where(inArray(this.table.main.id, queryIds))
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

    return result.map(row => row.id) as Id[];
  }

  private insertModelArrayToTableArrayResult(
    models: (MultiInsertModel<Table> & { id: Id })[],
  ): MultiModelInsertTableArray<Table> {
    if (models.length === 0) throw new Error("model array is empty");
    return {
      main: models.map(m => m.main),
      oneToOne: Object.fromEntries(
        Object.keys(this.table.oneToOne).map(key => [
          key,
          models.map(m => ({
            ...m.oneToOne[key as keyof typeof m.oneToOne],
            [this.mainTableIdName]: m.id,
          })),
        ]),
      ) as unknown as MultiModelInsertTableArray<Table>["oneToOne"],
      oneToMany: Object.fromEntries(
        Object.keys(this.table.oneToMany).map(key => [
          key,
          models.flatMap(m => m.oneToMany[key as keyof typeof m.oneToMany]),
        ]),
      ) as unknown as MultiModelInsertTableArray<Table>["oneToMany"],
    };
  }

  private selectTableArrayResultToModelArray(
    tableResult: MultiModelSelectTableArray<Table>,
  ): MultiSelectModel<Table>[] {
    const oneToOneMaps = Object.fromEntries(
      Object.entries(tableResult.oneToOne).map(([key, rows]) => [
        key,
        new Map(rows.map(row => [row[this.mainTableIdName], row])),
      ]),
    ) as Record<
      keyof Table["oneToOne"],
      Map<IdType, InferSelectModel<Table["oneToOne"][keyof Table["oneToOne"]]>>
    >;

    const oneToManyMaps = Object.fromEntries(
      Object.entries(tableResult.oneToMany).map(([key, rows]) => {
        const map = new Map<
          IdType,
          InferSelectModel<Table["oneToMany"][keyof Table["oneToMany"]]>[]
        >();
        rows.forEach(row => {
          const id = row[this.mainTableIdName];
          if (!map.has(id)) map.set(id, []);
          map.get(id)!.push(row);
        });
        return [key, map];
      }),
    ) as Record<
      keyof Table["oneToMany"],
      Map<
        IdType,
        InferSelectModel<Table["oneToMany"][keyof Table["oneToMany"]]>[]
      >
    >;

    return tableResult.main.map(main => {
      const { id } = main;

      const oneToOne = Object.fromEntries(
        Object.entries(tableResult.oneToOne).map(([key]) => [
          key,
          oneToOneMaps[key].get(id as IdType),
        ]),
      ) as MultiSelectModel<Table>["oneToOne"];

      const oneToMany = Object.fromEntries(
        Object.entries(tableResult.oneToMany).map(([key]) => [
          key,
          oneToManyMaps[key].get(id as IdType),
        ]),
      ) as MultiSelectModel<Table>["oneToMany"];

      return { main, oneToOne, oneToMany };
    });
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
