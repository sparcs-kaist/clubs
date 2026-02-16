import { Injectable } from "@nestjs/common";

import { FundingDeadlineEnum } from "@clubs/interface/common/enum/funding.enum";

import {
  BaseTableFieldMapKeys,
  PrimitiveConditionValue,
} from "@sparcs-clubs/api/common/base/base.repository";
import { BaseSingleTableRepository } from "@sparcs-clubs/api/common/base/base.single.repository";
import {
  IFundingDeadlineCreate,
  MFundingDeadline,
} from "@sparcs-clubs/api/feature/semester/model/funding.deadline.model";

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

type FundingDeadlineFieldMapKeys = BaseTableFieldMapKeys<
  FundingDeadlineQuery,
  FundingDeadlineOrderByKeys,
  FundingDeadlineQuerySupport
>;

@Injectable()
export class FundingDeadlineRepository extends BaseSingleTableRepository<
  MFundingDeadline,
  IFundingDeadlineCreate,
  FundingDeadlineQuery,
  FundingDeadlineOrderByKeys,
  FundingDeadlineQuerySupport
> {
  constructor() {
    super("fundingDeadlineD", MFundingDeadline);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected dbToModelMapping(result: any): MFundingDeadline {
    return new MFundingDeadline({
      id: result.id,
      semester: { id: result.semesterId },
      deadlineEnum: result.deadlineEnum,
      startTerm: result.startTerm,
      endTerm: result.endTerm,
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected modelToDBMapping(model: MFundingDeadline): any {
    return {
      id: model.id,
      semesterId: model.semester.id,
      deadlineEnum: model.deadlineEnum,
      startTerm: model.startTerm,
      endTerm: model.endTerm,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected createToDBMapping(model: IFundingDeadlineCreate): any {
    return {
      semesterId: model.semester.id,
      deadlineEnum: model.deadlineEnum,
      startTerm: model.startTerm,
      endTerm: model.endTerm,
    };
  }

  protected fieldMap(
    field: FundingDeadlineFieldMapKeys,
  ): string | null | undefined {
    const fieldMappings: Record<FundingDeadlineFieldMapKeys, string | null> = {
      id: "id",
      semesterId: "semesterId",
      deadlineEnum: "deadlineEnum",
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
    key: FundingDeadlineFieldMapKeys,
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
