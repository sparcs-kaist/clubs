import { Injectable } from "@nestjs/common";

import {
  BaseRepositoryFindQuery,
  BaseRepositoryQuery,
  BaseTableFieldMapKeys,
} from "@sparcs-clubs/api/common/base/base.repository";
import { BaseSingleTableRepository } from "@sparcs-clubs/api/common/base/base.single.repository";
import {
  IDivisionCreate,
  MDivision,
} from "@sparcs-clubs/api/feature/division/model/division.model";

export type DivisionQuery = {
  // id: number; // id 는 기본 내장
  name: string;
  districtId: number;
  date: Date;
};

type DivisionOrderByKeys = "id" | "districtId";
type DivisionQuerySupport = {
  startTerm: Date;
  endTerm: Date;
}; // Query Support 용

type DivisionFieldMapKeys = BaseTableFieldMapKeys<
  DivisionQuery,
  DivisionOrderByKeys,
  DivisionQuerySupport
>;

export type DivisionRepositoryFindQuery = BaseRepositoryFindQuery<
  DivisionQuery,
  DivisionOrderByKeys
>;
export type DivisionRepositoryQuery = BaseRepositoryQuery<DivisionQuery>;

@Injectable()
export class DivisionRepository extends BaseSingleTableRepository<
  MDivision,
  IDivisionCreate,
  DivisionQuery,
  DivisionOrderByKeys,
  DivisionQuerySupport
> {
  constructor() {
    super("division", MDivision);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected dbToModelMapping(result: any): MDivision {
    return new MDivision({
      id: result.id,
      name: result.name,
      district: { id: result.districtId },
      startTerm: result.startTerm,
      endTerm: result.endTerm,
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected modelToDBMapping(model: MDivision): any {
    return {
      id: model.id,
      name: model.name,
      districtId: model.district.id,
      startTerm: model.startTerm,
      endTerm: model.endTerm,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected createToDBMapping(model: IDivisionCreate): any {
    return {
      name: model.name,
      districtId: model.district.id,
      startTerm: model.startTerm,
      endTerm: model.endTerm,
    };
  }

  protected fieldMap(field: DivisionFieldMapKeys): string | null | undefined {
    const fieldMappings: Record<DivisionFieldMapKeys, string | null> = {
      id: "id",
      name: "name",
      districtId: "districtId",
      startTerm: "startTerm",
      endTerm: "endTerm",
      date: null,
    };

    if (!(field in fieldMappings)) {
      return undefined;
    }

    return fieldMappings[field as keyof typeof fieldMappings];
  }

  protected processSpecialCondition(
    key: DivisionFieldMapKeys,
    value: unknown,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Record<string, any> {
    if (key === "date" && value instanceof Date) {
      return {
        NOT: {
          OR: [
            { startTerm: { gt: value } },
            { AND: [{ endTerm: { not: null } }, { endTerm: { lte: value } }] },
          ],
        },
      };
    }

    throw Error(`Invalid key value: ${key} ${value}`);
  }
}
