import { Injectable } from "@nestjs/common";
import {
  and,
  gt,
  InferInsertModel,
  InferSelectModel,
  lte,
  SQL,
} from "drizzle-orm";

import {
  BaseTableFieldMapKeys,
  PrimitiveConditionValue,
  TableWithID,
} from "@sparcs-clubs/api/common/base/base.repository";
import { BaseSingleTableRepository } from "@sparcs-clubs/api/common/base/base.single.repository";
import { SemesterD } from "@sparcs-clubs/api/drizzle/schema/semester.schema";
import {
  ISemesterCreate,
  MSemester,
} from "@sparcs-clubs/api/feature/semester/model/semester.model";

export type SemesterQuery = { date: Date; endTerm: Date };

type SemesterOrderByKeys = "id" | "year" | "name" | "startTerm" | "endTerm";
type SemesterQuerySupport = {
  startTerm: string;
  endTerm: string;
};

type SemesterTable = typeof SemesterD;
type SemesterDbSelect = InferSelectModel<SemesterTable>;
type SemesterDbUpdate = Partial<SemesterDbSelect>;
type SemesterDbInsert = InferInsertModel<SemesterTable>;

type SemesterFieldMapKeys = BaseTableFieldMapKeys<
  SemesterQuery,
  SemesterOrderByKeys,
  SemesterQuerySupport
>;

@Injectable()
export class SemesterRepository extends BaseSingleTableRepository<
  MSemester,
  ISemesterCreate,
  SemesterTable,
  SemesterQuery,
  SemesterOrderByKeys,
  SemesterQuerySupport
> {
  constructor() {
    super(SemesterD, MSemester);
  }

  protected dbToModelMapping(result: SemesterDbSelect): MSemester {
    return new MSemester({
      id: result.id,
      year: result.year,
      name: result.name,
      startTerm: result.startTerm,
      endTerm: result.endTerm,
    });
  }

  protected modelToDBMapping(model: MSemester): SemesterDbUpdate {
    return {
      id: model.id,
      year: model.year,
      name: model.name,
      startTerm: model.startTerm,
      endTerm: model.endTerm,
    };
  }

  protected createToDBMapping(model: ISemesterCreate): SemesterDbInsert {
    return {
      year: model.year,
      name: model.name,
      startTerm: model.startTerm,
      endTerm: model.endTerm,
    };
  }

  protected fieldMap(
    field: SemesterFieldMapKeys,
  ): TableWithID | null | undefined {
    const fieldMappings: Record<SemesterFieldMapKeys, TableWithID | null> = {
      id: SemesterD,
      year: SemesterD,
      name: SemesterD,
      startTerm: SemesterD,
      endTerm: SemesterD,
      date: null,
    };

    if (!(field in fieldMappings)) {
      return undefined;
    }

    return fieldMappings[field];
  }

  protected processSpecialCondition(
    key: SemesterFieldMapKeys,
    value: PrimitiveConditionValue,
  ): SQL {
    if (key === "date" && value instanceof Date) {
      // console.log(`semester date: ${value}`);
      return and(lte(SemesterD.startTerm, value), gt(SemesterD.endTerm, value));
    }

    throw new Error(`Invalid key: ${key}`);
  }
}
