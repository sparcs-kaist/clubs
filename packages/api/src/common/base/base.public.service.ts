import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { MySql2Database } from "drizzle-orm/mysql2";

import { DrizzleAsyncProvider } from "@sparcs-clubs/api/drizzle/drizzle.provider";

import { IdType, MEntity } from "../model/entity.model";
import { takeOnlyOne } from "../util/util";

type ModelClass = { modelName: string };

type RepositoryQuery<
  MQ extends Record<string, unknown>,
  Id extends IdType = number,
> = Partial<MQ> & Partial<{ id: Id }>;

interface IBaseRepository<
  T extends MEntity<Id>,
  MQ extends Record<string, unknown>,
  Id extends IdType = number,
> {
  fetch(id: Id): Promise<T>;
  fetchAll(ids: Id[]): Promise<T[]>;
  find(query: RepositoryQuery<MQ, Id>): Promise<T[]>;
  count(query: RepositoryQuery<MQ, Id>): Promise<number>;
}

@Injectable()
export abstract class BasePublicService<
  Model extends MEntity<Id>,
  MQ extends Record<string, unknown> = {},
  SearchQuery extends Partial<MQ> = {},
  LoadQuery extends Partial<MQ> = {},
  IsQuery extends RepositoryQuery<MQ, Id> = {},
  Id extends IdType = number,
> {
  @Inject(DrizzleAsyncProvider) protected db: MySql2Database;

  constructor(
    protected repository: IBaseRepository<Model, MQ, Id>, // Repository 생성자가 들어가는 부분. 그런데 실제 구현 시에 DI로 inject해야 함
    protected modelClass: ModelClass, // 모델엔티티 생성자가 들어가는 부분, static 프로퍼티 사용을 위해서
  ) {}

  async getById(id: Id): Promise<Model> {
    return this.repository.fetch(id);
  }

  async getByIds(ids: Id[]): Promise<Model[]> {
    return this.repository.fetchAll(ids);
  }

  async search(query: SearchQuery): Promise<Model[]> {
    const result = await this.repository.find(query);
    return result;
  }

  async load(query: LoadQuery): Promise<Model> {
    const result = await this.repository.find(query).then(takeOnlyOne());
    return result;
  }

  async count(query: SearchQuery): Promise<number> {
    const result = await this.repository.count(query);
    return result;
  }

  async is(query: IsQuery): Promise<boolean> {
    const result = await this.repository.count(query);

    return result > 0;
  }

  async validate(query: IsQuery): Promise<void> {
    if (await this.is(query)) {
      return;
    }
    throw new BadRequestException(
      `Validation failed for ${this.modelClass.modelName}, Query: ${JSON.stringify(
        query,
      )}`,
    );
  }
}

// TODO: 나중에 OrderBy나 Offset, Limit 등을 추가할 수도 있음. 타입 추가도 필요할수도??
