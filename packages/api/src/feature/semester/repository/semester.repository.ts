import { Injectable } from "@nestjs/common";

import {
  BaseTableFieldMapKeys,
  PrimitiveConditionValue,
} from "@sparcs-clubs/api/common/base/base.repository";
import { BaseSingleTableRepository } from "@sparcs-clubs/api/common/base/base.single.repository";
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

type SemesterFieldMapKeys = BaseTableFieldMapKeys<
  SemesterQuery,
  SemesterOrderByKeys,
  SemesterQuerySupport
>;

@Injectable()
export class SemesterRepository extends BaseSingleTableRepository<
  MSemester,
  ISemesterCreate,
  SemesterQuery,
  SemesterOrderByKeys,
  SemesterQuerySupport
> {
  constructor() {
    super("semesterD", MSemester);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected dbToModelMapping(result: any): MSemester {
    return new MSemester({
      id: result.id,
      year: result.year,
      name: result.name,
      startTerm: result.startTerm,
      endTerm: result.endTerm,
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected modelToDBMapping(model: MSemester): any {
    return {
      id: model.id,
      year: model.year,
      name: model.name,
      startTerm: model.startTerm,
      endTerm: model.endTerm,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected createToDBMapping(model: ISemesterCreate): any {
    return {
      year: model.year,
      name: model.name,
      startTerm: model.startTerm,
      endTerm: model.endTerm,
    };
  }

  protected fieldMap(field: SemesterFieldMapKeys): string | null | undefined {
    const fieldMappings: Record<SemesterFieldMapKeys, string | null> = {
      id: "id",
      year: "year",
      name: "name",
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
    key: SemesterFieldMapKeys,
    value: PrimitiveConditionValue,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Record<string, any> {
    if (key === "date" && value instanceof Date) {
      return {
        AND: [{ startTerm: { lte: value } }, { endTerm: { gt: value } }],
      };
    }

    throw new Error(`Invalid key: ${key}`);
  }
}
