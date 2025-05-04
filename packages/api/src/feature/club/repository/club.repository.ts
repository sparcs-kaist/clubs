import { Injectable } from "@nestjs/common";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";

import {
  BaseTableFieldMapKeys,
  TableWithID,
} from "@sparcs-clubs/api/common/base/base.repository";
import { BaseSingleTableRepository } from "@sparcs-clubs/api/common/base/base.single.repository";
import { Club } from "@sparcs-clubs/api/drizzle/schema/club.schema";
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

type ClubTable = typeof Club;
type ClubDbSelect = InferSelectModel<ClubTable>;
type ClubDbUpdate = Partial<ClubDbSelect>;
type ClubDbInsert = InferInsertModel<ClubTable>;

type ClubFieldMapKeys = BaseTableFieldMapKeys<
  ClubQuery,
  ClubOrderByKeys,
  ClubQuerySupport
>;

@Injectable()
export class ClubRepository extends BaseSingleTableRepository<
  MClub,
  IClubCreate,
  ClubTable,
  ClubQuery,
  ClubOrderByKeys,
  ClubQuerySupport
> {
  constructor() {
    super(Club, MClub);
  }

  protected dbToModelMapping(result: ClubDbSelect): MClub {
    return new MClub({
      id: result.id,
      nameKr: result.nameKr,
      nameEn: result.nameEn,
      description: result.description,
      foundingYear: result.foundingYear,
    });
  }

  protected modelToDBMapping(model: MClub): ClubDbUpdate {
    return {
      id: model.id,
      nameKr: model.nameKr,
      nameEn: model.nameEn,
      description: model.description,
      foundingYear: model.foundingYear,
    };
  }

  protected createToDBMapping(model: IClubCreate): ClubDbInsert {
    return {
      nameKr: model.nameKr,
      nameEn: model.nameEn,
      description: model.description,
      foundingYear: model.foundingYear,
    };
  }

  protected fieldMap(field: ClubFieldMapKeys): TableWithID | null | undefined {
    const fieldMappings: Record<ClubFieldMapKeys, TableWithID | null> = {
      id: Club,
      nameKr: Club,
      nameEn: Club,
    };

    if (!(field in fieldMappings)) {
      return undefined;
    }

    return fieldMappings[field];
  }
}
