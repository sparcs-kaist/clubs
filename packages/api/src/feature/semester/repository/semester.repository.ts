import { Injectable } from "@nestjs/common";
import {
  and,
  gte,
  InferInsertModel,
  InferSelectModel,
  lt,
  SQL,
} from "drizzle-orm";

import { ISemester } from "@clubs/domain/semester/semester";

import {
  BaseTableFieldMapKeys,
  PrimitiveConditionValue,
  TableWithID,
} from "@sparcs-clubs/api/common/base/base.repository";
import { BaseSingleTableRepository } from "@sparcs-clubs/api/common/base/base.single.repository";
import { SemesterD } from "@sparcs-clubs/api/drizzle/schema/semester.schema";
import { MSemester } from "@sparcs-clubs/api/feature/semester/model/semester.model";

type SemesterQuery = {
  date: Date;
  startTerm: Date;
  endTerm: Date;
};

type SemesterOrderByKeys = "id";
type SemesterQuerySupport = {};

type SemesterTable = typeof SemesterD;
type SemesterDbSelect = InferSelectModel<SemesterTable>;
type SemesterDbInsert = InferInsertModel<SemesterTable>;
type SemesterDbUpdate = Partial<SemesterDbInsert>;

type SemesterFieldMapKeys = BaseTableFieldMapKeys<
  SemesterQuery,
  SemesterOrderByKeys,
  SemesterQuerySupport
>;

@Injectable()
export default class SemesterRepository extends BaseSingleTableRepository<
  MSemester,
  ISemester,
  SemesterTable,
  SemesterDbSelect,
  SemesterDbInsert,
  SemesterDbUpdate,
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

  protected fieldMap(
    field: SemesterFieldMapKeys,
  ): TableWithID | null | undefined {
    const fieldMappings: Record<SemesterFieldMapKeys, TableWithID | null> = {
      id: SemesterD,
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
      return and(gte(SemesterD.startTerm, value), lt(SemesterD.endTerm, value));
    }

    throw new Error(`Invalid key: ${key}`);
  }
}
