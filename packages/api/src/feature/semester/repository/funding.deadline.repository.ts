import { Injectable } from "@nestjs/common";
import { and, gt, InferSelectModel, lte, SQL } from "drizzle-orm";

import { FundingDeadlineEnum } from "@clubs/domain/semester/deadline";

import {
  BaseTableFieldMapKeys,
  PrimitiveConditionValue,
  TableWithID,
} from "@sparcs-clubs/api/common/base/base.repository";
import { BaseSingleTableRepository } from "@sparcs-clubs/api/common/base/base.single.repository";
import { FundingDeadlineD } from "@sparcs-clubs/api/drizzle/schema/semester.schema";
import { MFundingDeadline } from "@sparcs-clubs/api/feature/semester/model/funding.deadline.model";

export type FundingDeadlineQuery = {
  semesterId: number;
  date: Date;
  deadlineEnum: FundingDeadlineEnum;
};

type FundingDeadlineOrderByKeys = "id" | "startTerm" | "endTerm";
type FundingDeadlineQuerySupport = {
  startTerm: string;
  endTerm: string;
};

type FundingDeadlineTable = typeof FundingDeadlineD;
type FundingDeadlineDbSelect = InferSelectModel<FundingDeadlineTable>;
type FundingDeadlineDbUpdate = Partial<FundingDeadlineDbSelect>;

type FundingDeadlineFieldMapKeys = BaseTableFieldMapKeys<
  FundingDeadlineQuery,
  FundingDeadlineOrderByKeys,
  FundingDeadlineQuerySupport
>;

@Injectable()
export class FundingDeadlineRepository extends BaseSingleTableRepository<
  MFundingDeadline,
  FundingDeadlineTable,
  FundingDeadlineQuery,
  FundingDeadlineOrderByKeys,
  FundingDeadlineQuerySupport
> {
  constructor() {
    super(FundingDeadlineD, MFundingDeadline);
  }

  protected dbToModelMapping(
    result: FundingDeadlineDbSelect,
  ): MFundingDeadline {
    return new MFundingDeadline({
      id: result.id,
      semester: { id: result.semesterId },
      deadlineEnum: result.deadlineEnum,
      startTerm: result.startTerm,
      endTerm: result.endTerm,
    });
  }

  protected modelToDBMapping(model: MFundingDeadline): FundingDeadlineDbUpdate {
    return {
      id: model.id,
      semesterId: model.semester.id,
      deadlineEnum: model.deadlineEnum,
      startTerm: model.startTerm,
      endTerm: model.endTerm,
    };
  }

  protected fieldMap(
    field: FundingDeadlineFieldMapKeys,
  ): TableWithID | null | undefined {
    const fieldMappings: Record<
      FundingDeadlineFieldMapKeys,
      TableWithID | null
    > = {
      id: FundingDeadlineD,
      semesterId: FundingDeadlineD,
      deadlineEnum: FundingDeadlineD,
      startTerm: FundingDeadlineD,
      endTerm: FundingDeadlineD,
      date: null,
    };

    if (!(field in fieldMappings)) {
      return undefined;
    }

    return fieldMappings[field];
  }

  protected processSpecialCondition(
    key: FundingDeadlineFieldMapKeys,
    value: PrimitiveConditionValue,
  ): SQL {
    if (key === "date" && value instanceof Date) {
      return and(
        lte(FundingDeadlineD.startTerm, value),
        gt(FundingDeadlineD.endTerm, value),
      );
    }

    throw new Error(`Invalid key: ${key}`);
  }
}
