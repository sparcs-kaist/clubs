import { Injectable } from "@nestjs/common";

import {
  BaseRepositoryFindQuery,
  BaseRepositoryQuery,
  BaseTableFieldMapKeys,
} from "@sparcs-clubs/api/common/base/base.repository";
import { BaseSingleTableRepository } from "@sparcs-clubs/api/common/base/base.single.repository";
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
  DistrictQuery,
  DistrictOrderByKeys,
  DistrictQuerySupport
> {
  constructor() {
    super("district", MDistrict);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected dbToModelMapping(result: any): MDistrict {
    return new MDistrict({
      id: result.id,
      name: result.name,
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected modelToDBMapping(model: MDistrict): any {
    return {
      id: model.id,
      name: model.name,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected createToDBMapping(model: IDistrictCreate): any {
    return {
      name: model.name,
    };
  }

  protected fieldMap(field: DistrictFieldMapKeys): string | null | undefined {
    const fieldMappings: Record<DistrictFieldMapKeys, string | null> = {
      id: "id",
      name: "name",
    };

    if (!(field in fieldMappings)) {
      return undefined;
    }

    return fieldMappings[field as keyof typeof fieldMappings];
  }
}
