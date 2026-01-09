import { Injectable } from "@nestjs/common";
import {
  and,
  gt,
  InferInsertModel,
  InferSelectModel,
  lte,
  SQL,
} from "drizzle-orm";

import { ActivityDeadlineEnum } from "@clubs/interface/common/enum/activity.enum";

import {
  BaseTableFieldMapKeys,
  PrimitiveConditionValue,
  TableWithID,
} from "@sparcs-clubs/api/common/base/base.repository";
import { BaseSingleTableRepository } from "@sparcs-clubs/api/common/base/base.single.repository";
import { ActivityDeadlineD } from "@sparcs-clubs/api/drizzle/schema/semester.schema";
import {
  IActivityDeadlineCreate,
  MActivityDeadline,
} from "@sparcs-clubs/api/feature/semester/model/activity.deadline.model";

export type ActivityDeadlineQuery = {
  semesterId: number;
  date: Date;
  deadlineEnum: ActivityDeadlineEnum;
};

type ActivityDeadlineOrderByKeys = "id" | "startTerm" | "endTerm";
type ActivityDeadlineQuerySupport = {
  startTerm: string;
  endTerm: string;
};

type ActivityDeadlineTable = typeof ActivityDeadlineD;
type ActivityDeadlineDbSelect = InferSelectModel<ActivityDeadlineTable>;
type ActivityDeadlineDbUpdate = Partial<ActivityDeadlineDbSelect>;
type ActivityDeadlineDbInsert = InferInsertModel<ActivityDeadlineTable>;

type ActivityDeadlineFieldMapKeys = BaseTableFieldMapKeys<
  ActivityDeadlineQuery,
  ActivityDeadlineOrderByKeys,
  ActivityDeadlineQuerySupport
>;

@Injectable()
export class ActivityDeadlineRepository extends BaseSingleTableRepository<
  MActivityDeadline,
  IActivityDeadlineCreate,
  ActivityDeadlineTable,
  ActivityDeadlineQuery,
  ActivityDeadlineOrderByKeys,
  ActivityDeadlineQuerySupport
> {
  constructor() {
    super(ActivityDeadlineD, MActivityDeadline);
  }

  protected dbToModelMapping(
    result: ActivityDeadlineDbSelect,
  ): MActivityDeadline {
    return new MActivityDeadline({
      id: result.id,
      semester: { id: result.semesterId },
      deadlineEnum: result.deadlineEnum,
      startTerm: result.startTerm,
      endTerm: result.endTerm,
    });
  }

  protected modelToDBMapping(
    model: MActivityDeadline,
  ): ActivityDeadlineDbUpdate {
    return {
      id: model.id,
      semesterId: model.semester.id,
      deadlineEnum: model.deadlineEnum,
      startTerm: model.startTerm,
      endTerm: model.endTerm,
    };
  }

  protected createToDBMapping(
    model: IActivityDeadlineCreate,
  ): ActivityDeadlineDbInsert {
    return {
      semesterId: model.semester.id,
      deadlineEnum: model.deadlineEnum,
      startTerm: model.startTerm,
      endTerm: model.endTerm,
    };
  }

  protected fieldMap(
    field: ActivityDeadlineFieldMapKeys,
  ): TableWithID | null | undefined {
    const fieldMappings: Record<
      ActivityDeadlineFieldMapKeys,
      TableWithID | null
    > = {
      id: ActivityDeadlineD,
      semesterId: ActivityDeadlineD,
      deadlineEnum: ActivityDeadlineD,
      startTerm: ActivityDeadlineD,
      endTerm: ActivityDeadlineD,
      date: null,
    };

    if (!(field in fieldMappings)) {
      return undefined;
    }

    return fieldMappings[field];
  }

  protected processSpecialCondition(
    key: ActivityDeadlineFieldMapKeys,
    value: PrimitiveConditionValue,
  ): SQL {
    if (key === "date" && value instanceof Date) {
      return and(
        lte(ActivityDeadlineD.startTerm, value),
        gt(ActivityDeadlineD.endTerm, value),
      );
    }

    throw new Error(`Invalid key: ${key}`);
  }
}
