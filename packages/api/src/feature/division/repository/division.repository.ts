import { Injectable } from "@nestjs/common";
import {
  and,
  gt,
  InferInsertModel,
  InferSelectModel,
  isNotNull,
  lte,
  not,
  or,
  SQL,
} from "drizzle-orm";

import {
  BaseRepositoryFindQuery,
  BaseRepositoryQuery,
  BaseTableFieldMapKeys,
  TableWithID,
} from "@sparcs-clubs/api/common/base/base.repository";
import { BaseSingleTableRepository } from "@sparcs-clubs/api/common/base/base.single.repository";
import { Division } from "@sparcs-clubs/api/drizzle/schema/division.schema";
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

type DivisionTable = typeof Division;
type DivisionDbSelect = InferSelectModel<DivisionTable>;
type DivisionDbUpdate = Partial<DivisionDbSelect>;
type DivisionDbInsert = InferInsertModel<DivisionTable>;

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
  DivisionTable,
  DivisionQuery,
  DivisionOrderByKeys,
  DivisionQuerySupport
> {
  constructor() {
    super(Division, MDivision);
  }

  protected dbToModelMapping(result: DivisionDbSelect): MDivision {
    return new MDivision({
      id: result.id,
      name: result.name,
      district: { id: result.districtId },
      startTerm: result.startTerm,
      endTerm: result.endTerm,
    });
  }

  protected modelToDBMapping(model: MDivision): DivisionDbUpdate {
    return {
      id: model.id,
      name: model.name,
      districtId: model.district.id,
      startTerm: model.startTerm,
      endTerm: model.endTerm,
    };
  }

  protected createToDBMapping(model: IDivisionCreate): DivisionDbInsert {
    return {
      name: model.name,
      districtId: model.district.id,
      startTerm: model.startTerm,
      endTerm: model.endTerm,
    };
  }

  protected fieldMap(
    field: DivisionFieldMapKeys,
  ): TableWithID | null | undefined {
    const fieldMappings: Record<DivisionFieldMapKeys, TableWithID | null> = {
      id: Division,
      name: Division,
      districtId: Division,
      startTerm: Division,
      endTerm: Division,
      date: null,
    };

    if (!(field in fieldMappings)) {
      return undefined;
    }

    return fieldMappings[field];
  }

  protected processSpecialCondition(
    key: DivisionFieldMapKeys,
    value: unknown,
  ): SQL {
    if (key === "date" && value instanceof Date) {
      return not(
        or(
          gt(Division.startTerm, value),
          and(isNotNull(Division.endTerm), lte(Division.endTerm, value)),
        ),
      );
    }

    throw Error(`Invalid key value: ${key} ${value}`);
  }
}
