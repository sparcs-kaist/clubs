import { BadRequestException, Injectable } from "@nestjs/common";

import { DrizzleTransaction } from "@sparcs-clubs/api/drizzle/drizzle.provider";

import { takeOne, takeOnlyOne } from "../util/util";
import { IdType, IEntity, MEntity } from "./entity.model";

type ModelClass = { modelName: string };

type RepositoryQuery<
  ModelQuery extends Record<string, unknown>,
  Id extends IdType = number,
> = Partial<ModelQuery> & Partial<{ id: Id }>;

interface IBaseRepository<
  Model extends MEntity<IEntity<Id>, Id>,
  ModelQuery extends Record<string, unknown>,
  Id extends IdType = number,
> {
  fetch(id: Id): Promise<Model>;
  fetchAll(ids: Id[]): Promise<Model[]>;
  find(query: RepositoryQuery<ModelQuery, Id>): Promise<Model[]>;
  count(query: RepositoryQuery<ModelQuery, Id>): Promise<number>;
  getLockKey(): string;
  acquireLock(tx: DrizzleTransaction, query: ModelQuery): Promise<void>;
}

@Injectable()
export abstract class BasePublicService<
  Model extends MEntity<IEntity<Id>, Id>,
  ModelQuery extends Record<string, unknown> = {},
  SearchQuery extends Partial<ModelQuery> = {},
  IsQuery extends RepositoryQuery<ModelQuery, Id> = {},
  LoadQuery extends Partial<ModelQuery> = {},
  Id extends IdType = number,
> {
  constructor(
    protected repository: IBaseRepository<Model, ModelQuery, Id>, // Repository 생성자가 들어가는 부분. 그런데 실제 구현 시에 DI로 inject해야 함
    protected modelClass: ModelClass, // 모델엔티티 생성자가 들어가는 부분, static 프로퍼티 사용을 위해서
  ) {}

  getLockKey(): string {
    return this.repository.getLockKey();
  }

  acquireLock(tx: DrizzleTransaction, query: ModelQuery): Promise<void> {
    return this.repository.acquireLock(tx, query); // 타입이 맞으면 그냥 넘기면 됨!
  }

  /**
   * @description 모델의 id를 받아서 모델을 반환합니다.
   * @param id 모델의 id
   * @returns Model
   * @throws NotFoundException 모델이 존재하지 않을 경우
   */
  async getById(id: Id): Promise<Model> {
    return this.repository.fetch(id);
  }

  /**
   * @description 모델의 id를 받아서 모델을 반환합니다.
   * @param ids 모델의 id
   * @returns Model[]
   * @throws NotFoundException 모든 넘겨진 id들에 대해서 모델이 존재하지 않을 경우
   */
  async getByIds(ids: Id[]): Promise<Model[]> {
    return this.repository.fetchAll(ids);
  }

  /**
   * @deprecated JSDoc을 오버라이드해서 검색 조건에 대한 설명을 달아야 합니다.
   * @warning 만약 외부 모듈에서 사용 시에 이 문구를 본다면, git blame을 하...진 마시고 상속해서 JSDoc를 달아주세용
   * @description 모델을 검색합니다.
   * @param query 검색 조건
   * @returns Model[]
   */
  async search(query: SearchQuery): Promise<Model[]> {
    const result = await this.repository.find(query);
    return result;
  }

  /**
   * @description 모델을 검색하여 하나만 가져옵니다.
   * @description unique key일 필요는 없습니다.
   * @param query 검색 조건
   * @returns Model|null
   */
  async searchOne(query: SearchQuery): Promise<Model | null> {
    const result = await this.search(query).then(takeOne);
    return result;
  }

  /**
   * @deprecated JSDoc을 오버라이드해서 사용해야 합니다.
   * @warning 만약 외부 모듈에서 사용 시에 이 문구를 본다면, git blame을 하...진 마시고 상속해서 JSDoc를 달아주세용
   * @description 모델을 Search하고 그 개수를 반환합니다.
   * @param query 조회 조건
   * @returns Model
   */
  async count(query: SearchQuery): Promise<number> {
    const result = await this.repository.count(query);
    return result;
  }

  /**
   * @deprecated JSDoc을 오버라이드해서 사용해야 합니다.
   * @warning 만약 외부 모듈에서 사용 시에 이 문구를 본다면, git blame을 하...진 마시고 상속해서 JSDoc를 달아주세용
   * @description 모델을 load, 즉 "반드시 하나만 존재하는 조건 하에" 하나를 가져옵니다.
   * @param query 로드 조건
   * @returns Model
   * @throws NotFoundException 모델이 존재하지 않을 경우
   */
  async load(query: LoadQuery): Promise<Model> {
    const result = await this.repository.find(query).then(takeOnlyOne());
    return result;
  }

  /**
   * @deprecated JSDoc을 오버라이드해서 사용해야 합니다.
   * @warning 만약 외부 모듈에서 사용 시에 이 문구를 본다면, git blame을 하...진 마시고 상속해서 JSDoc를 달아주세용
   * @description 검색 조건에 따른 모델이 존재하는지 확인합니다.
   * @param query 조회 조건
   * @returns boolean
   */
  async is(query: IsQuery): Promise<boolean> {
    const result = await this.repository.count(query);

    return result > 0;
  }

  /**
   * @deprecated JSDoc을 오버라이드해서 사용해야 합니다.
   * @warning 만약 외부 모듈에서 사용 시에 이 문구를 본다면, git blame을 하...진 마시고 상속해서 JSDoc를 달아주세용
   * @description 검색 조건에 따른 모델이 존재하는지 확인하고, 존재하지 않으면 예외를 던집니다.
   * @param query 검색 조건
   * @throws BadRequestException 모델이 존재하지 않을 경우
   */
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

// TODO: 나중에 OrderBy나 Offset, Limit 등을 추가할 수도 있음. 타입 추가도 필요할 확률 높음
