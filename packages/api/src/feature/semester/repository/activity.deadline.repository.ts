import { Injectable } from "@nestjs/common";
import {
  and,
  gte,
  InferInsertModel,
  InferSelectModel,
  lt,
  SQL,
} from "drizzle-orm";

import {
  ActivityDeadlineEnum,
  IActivityDeadline,
} from "@clubs/domain/semester/deadline";

import {
  BaseTableFieldMapKeys,
  PrimitiveConditionValue,
  TableWithID,
} from "@sparcs-clubs/api/common/base/base.repository";
import { BaseSingleTableRepository } from "@sparcs-clubs/api/common/base/base.single.repository";
import { ActivityDeadlineD } from "@sparcs-clubs/api/drizzle/schema/semester.schema";
import { MActivityDeadline } from "@sparcs-clubs/api/feature/semester/model/activity.deadline.model";

type ActivityDeadlineQuery = {
  semesterId: number;
  date: Date;
  deadlineEnum: ActivityDeadlineEnum;
};

type ActivityDeadlineOrderByKeys = "id";
type ActivityDeadlineQuerySupport = {
  startTerm: string;
  endTerm: string;
};

type ActivityDeadlineTable = typeof ActivityDeadlineD;
type ActivityDeadlineDbSelect = InferSelectModel<ActivityDeadlineTable>;
type ActivityDeadlineDbInsert = InferInsertModel<ActivityDeadlineTable>;
type ActivityDeadlineDbUpdate = Partial<ActivityDeadlineDbInsert>;

type ActivityDeadlineFieldMapKeys = BaseTableFieldMapKeys<
  ActivityDeadlineQuery,
  ActivityDeadlineOrderByKeys,
  ActivityDeadlineQuerySupport
>;

@Injectable()
export default class ActivityDeadlineRepository extends BaseSingleTableRepository<
  MActivityDeadline,
  IActivityDeadline,
  ActivityDeadlineTable,
  ActivityDeadlineDbSelect,
  ActivityDeadlineDbInsert,
  ActivityDeadlineDbUpdate,
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
        gte(ActivityDeadlineD.startTerm, value),
        lt(ActivityDeadlineD.endTerm, value),
      );
    }

    throw new Error(`Invalid key: ${key}`);
  }
}
