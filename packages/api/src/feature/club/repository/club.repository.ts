import { Injectable } from "@nestjs/common";

import {
  BaseRepositoryFindQuery,
  BaseRepositoryQuery,
  BaseTableFieldMapKeys,
} from "@sparcs-clubs/api/common/base/base.repository";
import { BaseSingleTableRepository } from "@sparcs-clubs/api/common/base/base.single.repository";
import {
  IClubCreate,
  MClub,
} from "@sparcs-clubs/api/feature/club/model/club.model";

export type ClubQuery = {
  // id: number; // id 는 기본 내장
  nameKr: string;
  nameEn: string;
};

type ClubOrderByKeys = "id";
type ClubQuerySupport = {}; // Query Support 용

type ClubFieldMapKeys = BaseTableFieldMapKeys<
  ClubQuery,
  ClubOrderByKeys,
  ClubQuerySupport
>;

export type ClubRepositoryFindQuery = BaseRepositoryFindQuery<
  ClubQuery,
  ClubOrderByKeys
>;
export type ClubRepositoryQuery = BaseRepositoryQuery<ClubQuery>;

@Injectable()
export class ClubRepository extends BaseSingleTableRepository<
  MClub,
  IClubCreate,
  ClubQuery,
  ClubOrderByKeys,
  ClubQuerySupport
> {
  constructor() {
    super("club", MClub);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected dbToModelMapping(result: any): MClub {
    return new MClub({
      id: result.id,
      nameKr: result.nameKr,
      nameEn: result.nameEn,
      description: result.description,
      foundingYear: result.foundingYear,
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected modelToDBMapping(model: MClub): any {
    return {
      id: model.id,
      nameKr: model.nameKr,
      nameEn: model.nameEn,
      description: model.description,
      foundingYear: model.foundingYear,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected createToDBMapping(model: IClubCreate): any {
    return {
      nameKr: model.nameKr,
      nameEn: model.nameEn,
      description: model.description,
      foundingYear: model.foundingYear,
    };
  }

  protected fieldMap(field: ClubFieldMapKeys): string | null | undefined {
    const fieldMappings: Record<ClubFieldMapKeys, string | null> = {
      id: "id",
      nameKr: "nameKr",
      nameEn: "nameEn",
    };

    if (!(field in fieldMappings)) {
      return undefined;
    }

    return fieldMappings[field as keyof typeof fieldMappings];
  }
}
