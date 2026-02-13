import { Injectable } from "@nestjs/common";

import { IdType, MEntity, ModelPatchFunction } from "../base/entity.model";
import { forEachAsyncSequentially } from "../util/util";
import {
  BaseRepository,
  BaseRepositoryFindQuery,
  BaseRepositoryQuery,
  BaseTableFieldMapKeys,
  ModelConstructor,
  PlainObject,
  PrismaTransactionClient,
} from "./base.repository";

// Multi-table 에서 사용하는 타입
// Prisma에서는 relation을 통해 oneToOne, oneToMany를 자동으로 처리하므로
// 기존 Drizzle의 MultiSelectModel, MultiInsertModel, MultiUpdateModel 대신
// Prisma의 include/create/update 패턴을 사용

// 하위 레포지토리에서 사용하기 위한 타입 정의
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type MultiSelectModel<_T = any> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  main: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  oneToOne: Record<string, Record<string, any>>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  oneToMany: Record<string, Record<string, any>[]>;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type MultiInsertModel<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _T = any,
  _MainIdKey extends string = "mainId",
> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  main: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  oneToOne: Record<string, Record<string, any>>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  oneToMany: Record<string, Record<string, any>[]>;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type MultiUpdateModel<_T = any> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  main: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  oneToOne: Record<string, Record<string, any>>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  oneToMany: Record<string, Record<string, any>[]>;
};

// Prisma relation config
export type PrismaMultiTableConfig = {
  main: string; // prisma model name, e.g. "professor"
  oneToOne: Record<
    string,
    {
      prismaModelName: string; // e.g. "professorT"
      relationField: string; // e.g. "professorTs" (relation field on main model for include)
      foreignKey: string; // e.g. "professorId" (FK column in sub table)
    }
  >;
  oneToMany: Record<
    string,
    {
      prismaModelName: string;
      relationField: string;
      foreignKey: string;
    }
  >;
};

///////////////////////////////////////////////////////////////////////////////
// BaseMultiTableRepository (Prisma version)
//
// Multi-table 패턴: main 테이블 + oneToOne/oneToMany 서브 테이블들
// Prisma에서는 include를 통해 relation을 자동으로 가져오거나,
// 별도 쿼리로 서브 테이블을 조회
@Injectable()
export abstract class BaseMultiTableRepository<
  Model extends MEntity<Id> & IModelCreate,
  IModelCreate,
  MainIdKey extends string,
  Query extends PlainObject,
  OrderByKeys extends string = "id",
  QuerySupport extends PlainObject = {},
  Id extends IdType = number,
> extends BaseRepository<
  Model,
  IModelCreate,
  MultiSelectModel,
  MultiInsertModel<unknown, MainIdKey>,
  MultiUpdateModel,
  Query,
  OrderByKeys,
  QuerySupport,
  Id
> {
  constructor(
    protected readonly tableConfig: PrismaMultiTableConfig,
    protected readonly modelConstructor: ModelConstructor<Model, Id>,
    protected readonly mainTableIdName: string, // FK name in sub tables, e.g. "professorId"
  ) {
    super(modelConstructor, tableConfig.main);
  }

  /**
   * @description DB -> Model
   */
  protected abstract dbToModelMapping(result: MultiSelectModel): Model;

  /**
   * @description Model -> DB (for update)
   */
  protected abstract modelToDBMapping(model: Model): MultiUpdateModel;

  /**
   * @description ModelCreate -> DB (for create)
   */
  protected abstract createToDBMapping(
    model: IModelCreate,
  ): MultiInsertModel<unknown, MainIdKey>;

  /**
   * @description 필드 매핑
   */
  protected abstract fieldMap(
    field: BaseTableFieldMapKeys<Query, OrderByKeys, QuerySupport>,
  ): string | null | undefined;

  private getSubDelegate(
    prismaModelName: string,
    tx?: PrismaTransactionClient,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): any {
    const client = tx || this.prisma;
    return client[prismaModelName];
  }

  protected async findImplementation(
    query: BaseRepositoryFindQuery<Query, OrderByKeys, Id>,
    tx: PrismaTransactionClient,
  ): Promise<Model[]> {
    const mainIds = (await this.fetchMainTableIds(query, tx)).filter(
      (id): id is Id => id != null,
    );
    if (mainIds.length === 0) return [];

    const mainDelegate = this.getDelegate(tx);

    // Fetch main records
    const mainRecords = await mainDelegate.findMany({
      where: {
        id: { in: mainIds },
        deletedAt: null,
      },
    });

    // Fetch oneToOne records
    const oneToOneEntries = await Promise.all(
      Object.entries(this.tableConfig.oneToOne).map(async ([key, config]) => {
        const subDelegate = this.getSubDelegate(config.prismaModelName, tx);
        const rows = await subDelegate.findMany({
          where: {
            [config.foreignKey]: { in: mainIds },
            deletedAt: null,
          },
        });
        return [key, rows];
      }),
    );
    const oneToOne = Object.fromEntries(oneToOneEntries);

    // Fetch oneToMany records
    const oneToManyEntries = await Promise.all(
      Object.entries(this.tableConfig.oneToMany).map(async ([key, config]) => {
        const subDelegate = this.getSubDelegate(config.prismaModelName, tx);
        const rows = await subDelegate.findMany({
          where: {
            [config.foreignKey]: { in: mainIds },
            deletedAt: null,
          },
        });
        return [key, rows];
      }),
    );
    const oneToMany = Object.fromEntries(oneToManyEntries);

    // Assemble into MultiSelectModel array
    const dbSelects = this.assembleSelectResults(
      mainRecords,
      oneToOne,
      oneToMany,
    );

    return dbSelects.map(row => this.dbToModel(row));
  }

  protected async countImplementation(
    query: BaseRepositoryQuery<Query, Id>,
    tx: PrismaTransactionClient,
  ): Promise<number> {
    const mainIds = await this.fetchMainTableIds(query, tx);
    return mainIds.length;
  }

  protected async createImplementation(
    data: IModelCreate[],
    tx: PrismaTransactionClient,
  ): Promise<Model[]> {
    const dbFormattedData = data.map(d => this.createToDB(d));
    const mainDelegate = this.getDelegate(tx);

    // Insert main records and get IDs
    const processedData = await Promise.all(
      dbFormattedData.map(async model => {
        const created = await mainDelegate.create({ data: model.main });
        return { ...model, id: created.id as Id };
      }),
    );

    // Insert oneToOne records with FK
    await Promise.all(
      Object.entries(this.tableConfig.oneToOne).map(async ([key, config]) => {
        const subDelegate = this.getSubDelegate(config.prismaModelName, tx);
        await Promise.all(
          processedData.map(model =>
            subDelegate.create({
              data: {
                ...model.oneToOne[key],
                [this.mainTableIdName]: model.id,
              },
            }),
          ),
        );
      }),
    );

    // Insert oneToMany records with FK
    await Promise.all(
      Object.entries(this.tableConfig.oneToMany).map(async ([key, config]) => {
        const subDelegate = this.getSubDelegate(config.prismaModelName, tx);
        await Promise.all(
          processedData.flatMap(model =>
            (model.oneToMany[key] || []).map(row =>
              subDelegate.create({
                data: {
                  ...row,
                  [this.mainTableIdName]: model.id,
                },
              }),
            ),
          ),
        );
      }),
    );

    return this.fetchAll(
      processedData.map(m => m.id),
      tx,
    );
  }

  protected async putImplementation(
    model: Model,
    tx: PrismaTransactionClient,
  ): Promise<Model> {
    const data = this.modelToDB(model);
    const mainDelegate = this.getDelegate(tx);

    // Update main
    await mainDelegate.update({
      where: { id: model.id },
      data: data.main,
    });

    // Update oneToOne
    await Promise.all(
      Object.entries(this.tableConfig.oneToOne).map(async ([key, config]) => {
        const subDelegate = this.getSubDelegate(config.prismaModelName, tx);
        // Use updateMany since we filter by FK
        await subDelegate.updateMany({
          where: {
            [config.foreignKey]: model.id,
            deletedAt: null,
          },
          data: data.oneToOne[key],
        });
      }),
    );

    // Update oneToMany: soft-delete existing, then insert new
    await Promise.all(
      Object.entries(this.tableConfig.oneToMany).map(async ([key, config]) => {
        const subDelegate = this.getSubDelegate(config.prismaModelName, tx);
        // Soft-delete existing
        await subDelegate.updateMany({
          where: {
            [config.foreignKey]: model.id,
            deletedAt: null,
          },
          data: { deletedAt: new Date() },
        });
        // Insert new
        await Promise.all(
          (data.oneToMany[key] || []).map(row =>
            subDelegate.create({
              data: {
                ...row,
                [this.mainTableIdName]: model.id,
              },
            }),
          ),
        );
      }),
    );

    return this.fetch(model.id, tx);
  }

  protected async patchImplementation(
    query: BaseRepositoryQuery<Query, Id>,
    patchFunction: ModelPatchFunction<Model, Id>,
    tx: PrismaTransactionClient,
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
    tx: PrismaTransactionClient,
  ): Promise<boolean> {
    const mainIds = await this.fetchMainTableIds(query, tx);
    const mainDelegate = this.getDelegate(tx);

    // Soft-delete main
    await mainDelegate.updateMany({
      where: { id: { in: mainIds } },
      data: { deletedAt: new Date() },
    });

    // Soft-delete oneToOne
    await Promise.all(
      Object.entries(this.tableConfig.oneToOne).map(([_, config]) => {
        const subDelegate = this.getSubDelegate(config.prismaModelName, tx);
        return subDelegate.updateMany({
          where: { [config.foreignKey]: { in: mainIds } },
          data: { deletedAt: new Date() },
        });
      }),
    );

    // Soft-delete oneToMany
    await Promise.all(
      Object.entries(this.tableConfig.oneToMany).map(([_, config]) => {
        const subDelegate = this.getSubDelegate(config.prismaModelName, tx);
        return subDelegate.updateMany({
          where: { [config.foreignKey]: { in: mainIds } },
          data: { deletedAt: new Date() },
        });
      }),
    );

    return true;
  }

  /**
   * @description 락을 잡는 쿼리를 실행하는 메서드
   */
  protected async executeLockQuery(
    tx: PrismaTransactionClient,
    query: BaseRepositoryQuery<Query, Id>,
    lockSql: string,
  ): Promise<void> {
    const mainIds = await this.fetchMainTableIds(query, tx);
    if (mainIds.length === 0) return;

    const placeholders = mainIds.map(() => "?").join(",");
    const mainTableName = this.getDbTableName(this.tableConfig.main);

    type RawClient = {
      $queryRawUnsafe: (sql: string, ...values: unknown[]) => Promise<unknown>;
    };

    await (tx as unknown as RawClient).$queryRawUnsafe(
      `SELECT 1 FROM \`${mainTableName}\` WHERE id IN (${placeholders}) ${lockSql}`,
      ...mainIds,
    );

    await forEachAsyncSequentially(
      [
        ...Object.values(this.tableConfig.oneToOne),
        ...Object.values(this.tableConfig.oneToMany),
      ],
      async config => {
        const tableName = this.getDbTableName(config.prismaModelName);
        const fkColumn = config.foreignKey.replace(
          /[A-Z]/g,
          letter => `_${letter.toLowerCase()}`,
        );
        await (tx as unknown as RawClient).$queryRawUnsafe(
          `SELECT 1 FROM \`${tableName}\` WHERE \`${fkColumn}\` IN (${placeholders}) ${lockSql}`,
          ...mainIds,
        );
      },
    );
  }

  /**
   * @description Prisma 모델 이름에서 DB 테이블 이름을 생성 (camelCase -> snake_case)
   */
  protected getDbTableName(prismaModelName: string): string {
    return prismaModelName.replace(
      /[A-Z]/g,
      letter => `_${letter.toLowerCase()}`,
    );
  }

  /**
   * @description 쿼리에 해당하는 메인 테이블의 id를 가져오는 메서드
   */
  private async fetchMainTableIds(
    query: BaseRepositoryFindQuery<Query, OrderByKeys, Id>,
    tx: PrismaTransactionClient,
  ): Promise<Id[]> {
    // id-only query 최적화
    if (Object.keys(query).length === 1 && query.id) {
      return Array.isArray(query.id) ? (query.id as Id[]) : [query.id as Id];
    }

    const mainDelegate = this.getDelegate(tx);
    const where = this.makeWhereClause(query);

    const results = await mainDelegate.findMany({
      where,
      select: { id: true },
      distinct: ["id"],
    });

    const queryIds = results.map((r: { id: Id }) => r.id);
    if (queryIds.length === 0) return [];

    if (!query.orderBy && !query.pagination) return queryIds;

    // Apply pagination and ordering
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const findArgs: any = {
      where: {
        id: { in: queryIds },
        deletedAt: null,
      },
      select: { id: true },
    };

    if (query.pagination) {
      findArgs.take = query.pagination.itemCount;
      findArgs.skip =
        (query.pagination.offset - 1) * query.pagination.itemCount;
    }

    if (query.orderBy) {
      findArgs.orderBy = this.makeOrderBy(query.orderBy);
    }

    const paginatedResults = await mainDelegate.findMany(findArgs);
    return paginatedResults.map((row: { id: Id }) => row.id);
  }

  /**
   * @description Select 결과를 MultiSelectModel 배열로 변환
   */
  private assembleSelectResults(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mainRecords: any[],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    oneToOneRecords: Record<string, any[]>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    oneToManyRecords: Record<string, any[]>,
  ): MultiSelectModel[] {
    // Build lookup maps for oneToOne
    const oneToOneMaps = Object.fromEntries(
      Object.entries(oneToOneRecords).map(([key, rows]) => {
        const config = this.tableConfig.oneToOne[key];
        return [key, new Map(rows.map(row => [row[config.foreignKey], row]))];
      }),
    );

    // Build lookup maps for oneToMany
    const oneToManyMaps = Object.fromEntries(
      Object.entries(oneToManyRecords).map(([key, rows]) => {
        const config = this.tableConfig.oneToMany[key];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const map = new Map<IdType, any[]>();
        rows.forEach(row => {
          const id = row[config.foreignKey];
          if (!map.has(id)) map.set(id, []);
          map.get(id)!.push(row);
        });
        return [key, map];
      }),
    );

    return mainRecords.map(main => {
      const { id } = main;

      const oneToOne = Object.fromEntries(
        Object.keys(this.tableConfig.oneToOne).map(key => [
          key,
          oneToOneMaps[key]?.get(id),
        ]),
      );

      const oneToMany = Object.fromEntries(
        Object.keys(this.tableConfig.oneToMany).map(key => [
          key,
          oneToManyMaps[key]?.has(id) ? oneToManyMaps[key].get(id) : [],
        ]),
      );

      return { main, oneToOne, oneToMany };
    });
  }

  /**
   * @override SpecialCondition 이 존재할 때 구현해야 함
   */
  protected processSpecialCondition(
    key: BaseTableFieldMapKeys<Query, OrderByKeys, QuerySupport>,
    value: unknown,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Record<string, any> {
    throw new Error(`Invalid special condition: ${String(key)} ${value}`);
  }
}
