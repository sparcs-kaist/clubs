import { Injectable } from "@nestjs/common";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";

import {
  BaseRepositoryFindQuery,
  BaseRepositoryQuery,
  BaseTableFieldMapKeys,
  TableWithID,
} from "@sparcs-clubs/api/common/base/base.repository";
import { BaseSingleTableRepository } from "@sparcs-clubs/api/common/base/base.single.repository";
import { District } from "@sparcs-clubs/api/drizzle/schema/division.schema";
import {
  IDistrictCreate,
  MDistrict,
} from "@sparcs-clubs/api/feature/division/model/district.model";

export type DistrictQuery = {
  // id: number; // id 는 기본 내장
  name: string;
};

type DistrictOrderByKeys = "id";
type DistrictQuerySupport = {}; // Query Support 용

type DistrictTable = typeof District;
type DistrictDbSelect = InferSelectModel<DistrictTable>;
type DistrictDbUpdate = Partial<DistrictDbSelect>;
type DistrictDbInsert = InferInsertModel<DistrictTable>;

type DistrictFieldMapKeys = BaseTableFieldMapKeys<
  DistrictQuery,
  DistrictOrderByKeys,
  DistrictQuerySupport
>;

export type DistrictRepositoryFindQuery = BaseRepositoryFindQuery<
  DistrictQuery,
  DistrictOrderByKeys
>;
export type DistrictRepositoryQuery = BaseRepositoryQuery<DistrictQuery>;

@Injectable()
export class DistrictRepository extends BaseSingleTableRepository<
  MDistrict,
  IDistrictCreate,
  DistrictTable,
  DistrictQuery,
  DistrictOrderByKeys,
  DistrictQuerySupport
> {
  constructor() {
    super(District, MDistrict);
  }

  protected dbToModelMapping(result: DistrictDbSelect): MDistrict {
    return new MDistrict({
      id: result.id,
      name: result.name,
    });
  }

  protected modelToDBMapping(model: MDistrict): DistrictDbUpdate {
    return {
      id: model.id,
      name: model.name,
    };
  }

  protected createToDBMapping(model: IDistrictCreate): DistrictDbInsert {
    return {
      name: model.name,
    };
  }

  protected fieldMap(
    field: DistrictFieldMapKeys,
  ): TableWithID | null | undefined {
    const fieldMappings: Record<DistrictFieldMapKeys, TableWithID | null> = {
      id: District,
      name: District,
    };

    if (!(field in fieldMappings)) {
      return undefined;
    }

    return fieldMappings[field];
  }
}
