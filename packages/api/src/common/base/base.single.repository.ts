import { Injectable } from "@nestjs/common";

import { IdType, MEntity, ModelPatchFunction } from "../base/entity.model";
import {
  BaseRepository,
  BaseRepositoryFindQuery,
  BaseRepositoryQuery,
  BaseTableFieldMapKeys,
  ModelConstructor,
  PlainObject,
  PrismaTransactionClient,
} from "./base.repository";

///////////////////////////////////////////////////////////////////////////////
// BaseSingleTableRepository (Prisma version)
// 단일 Prisma 모델에 대한 CRUD 기본 구현
@Injectable()
export abstract class BaseSingleTableRepository<
  Model extends MEntity<Id> & IModelCreate,
  IModelCreate,
  // DbSelect/DbInsert/DbUpdate 는 Prisma에서 자동 생성된 타입을 사용
  // 하위 레포지토리에서 구체 타입을 정의
  Query extends PlainObject,
  OrderByKeys extends string = "id",
  QuerySupport extends PlainObject = {},
  Id extends IdType = number,
> extends BaseRepository<
  Model,
  IModelCreate,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any, // DbSelect: Prisma auto-generated, 하위에서 dbToModelMapping의 파라미터로 지정
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any, // DbInsert
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any, // DbUpdate
  Query,
  OrderByKeys,
  QuerySupport,
  Id
> {
  constructor(
    protected readonly prismaModelName: string,
    protected readonly modelConstructor: ModelConstructor<Model, Id>,
  ) {
    super(modelConstructor, prismaModelName);
  }

  /**
   * @description DB -> Model
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected abstract dbToModelMapping(result: any): Model;

  /**
   * @description Model -> DB (for update)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected abstract modelToDBMapping(model: Model): any;

  /**
   * @description ModelCreate -> DB (for create)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected abstract createToDBMapping(model: IModelCreate): any;

  /**
   * @description 필드 매핑: query field name -> prisma field name
   * @returns string (prisma 필드명), null (특수 조건), undefined (존재하지 않는 필드)
   */
  protected abstract fieldMap(
    field: BaseTableFieldMapKeys<Query, OrderByKeys, QuerySupport>,
  ): string | null | undefined;

  // find implementation using Prisma
  protected async findImplementation(
    query: BaseRepositoryFindQuery<Query, OrderByKeys, Id>,
    tx: PrismaTransactionClient,
  ): Promise<Model[]> {
    const delegate = this.getDelegate(tx);
    const where = this.makeWhereClause(query);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const findArgs: any = { where };

    if (query.pagination) {
      findArgs.take = query.pagination.itemCount;
      findArgs.skip =
        (query.pagination.offset - 1) * query.pagination.itemCount;
    }

    if (query.orderBy) {
      findArgs.orderBy = this.makeOrderBy(query.orderBy);
    }

    const results = await delegate.findMany(findArgs);
    return results.map((row: unknown) => this.dbToModel(row));
  }

  protected async countImplementation(
    query: BaseRepositoryQuery<Query, Id>,
    tx: PrismaTransactionClient,
  ): Promise<number> {
    const delegate = this.getDelegate(tx);
    const where = this.makeWhereClause(query);
    return delegate.count({ where });
  }

  protected async createImplementation(
    data: IModelCreate[],
    tx: PrismaTransactionClient,
  ): Promise<Model[]> {
    const delegate = this.getDelegate(tx);

    // Prisma doesn't have bulk create with returning IDs for MySQL,
    // so we insert one by one and fetch
    const ids = await Promise.all(
      data.map(async d => {
        const dbData = this.createToDB(d);
        const created = await delegate.create({ data: dbData });
        return created.id as Id;
      }),
    );

    return this.fetchAll(ids, tx);
  }

  protected async putImplementation(
    model: Model,
    tx: PrismaTransactionClient,
  ): Promise<Model> {
    const delegate = this.getDelegate(tx);
    const data = this.modelToDB(model);
    await delegate.update({
      where: { id: model.id },
      data,
    });

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
    const delegate = this.getDelegate(tx);
    const where = this.makeWhereClause(query);
    await delegate.updateMany({
      where,
      data: { deletedAt: this.clock.now() },
    });
    return true;
  }

  /**
   * @description 락을 잡는 쿼리를 실행하는 메서드 (raw SQL)
   */
  protected async executeLockQuery(
    tx: PrismaTransactionClient,
    query: BaseRepositoryQuery<Query, Id>,
    lockSql: string,
  ): Promise<void> {
    // Prisma에서는 raw SQL로 lock을 잡아야 함
    // 모델의 @@map 테이블 이름을 사용
    const where = this.makeWhereClause(query);
    const ids = await this.getDelegate(tx).findMany({
      where,
      select: { id: true },
    });
    const idValues = ids.map((r: { id: Id }) => r.id);
    if (idValues.length === 0) return;

    const placeholders = idValues.map(() => "?").join(",");
    // We need the actual DB table name. For raw SQL locks, we use Prisma.$queryRawUnsafe
    type RawClient = {
      $queryRawUnsafe: (sql: string, ...values: unknown[]) => Promise<unknown>;
    };
    await (tx as unknown as RawClient).$queryRawUnsafe(
      `SELECT 1 FROM \`${this.getDbTableName()}\` WHERE id IN (${placeholders}) ${lockSql}`,
      ...idValues,
    );
  }

  /**
   * @description DB 테이블 이름을 반환하는 메서드
   * @description 기본값은 prismaModelName을 snake_case로 변환. 하위에서 오버라이드 가능
   */
  protected getDbTableName(): string {
    // Convert camelCase to snake_case
    return this.prismaModelName.replace(
      /[A-Z]/g,
      letter => `_${letter.toLowerCase()}`,
    );
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
