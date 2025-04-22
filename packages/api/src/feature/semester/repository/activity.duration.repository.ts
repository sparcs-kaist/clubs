import { Injectable } from "@nestjs/common";
import { and, gte, InferSelectModel, lt, SQL } from "drizzle-orm";

import {
  ActivityDurationTypeEnum,
  IActivityDuration,
} from "@clubs/domain/semester/activity-duration";

import {
  BaseTableFieldMapKeys,
  PrimitiveConditionValue,
  TableWithID,
} from "@sparcs-clubs/api/common/base/base.repository";
import { BaseSingleTableRepository } from "@sparcs-clubs/api/common/base/base.single.repository";
import { ActivityD } from "@sparcs-clubs/api/drizzle/schema/semester.schema";
import { MActivityDuration } from "@sparcs-clubs/api/feature/semester/model/activity.duration.model";

type ActivityDurationQuery = {
  semesterId: number;
  date: Date;
  activityDurationTypeEnum: ActivityDurationTypeEnum;
};

type ActivityDurationOrderByKeys =
  | "id"
  | "semesterId"
  | "activityDurationTypeEnum"
  | "startTerm"
  | "endTerm";
type ActivityDurationQuerySupport = {
  startTerm: string;
  endTerm: string;
};

type ActivityDurationTable = typeof ActivityD;
type ActivityDbSelect = InferSelectModel<ActivityDurationTable>;
type ActivityDbUpdate = Partial<ActivityDbSelect>;

type ActivityDurationFieldMapKeys = BaseTableFieldMapKeys<
  ActivityDurationQuery,
  ActivityDurationOrderByKeys,
  ActivityDurationQuerySupport
>;

@Injectable()
export default class ActivityDurationRepository extends BaseSingleTableRepository<
  MActivityDuration,
  IActivityDuration,
  ActivityDurationTable,
  ActivityDurationQuery,
  ActivityDurationOrderByKeys,
  ActivityDurationQuerySupport
> {
  constructor() {
    super(ActivityD, MActivityDuration);
  }

  protected dbToModelMapping(result: ActivityDbSelect): MActivityDuration {
    return new MActivityDuration({
      id: result.id,
      semester: { id: result.semesterId },
      activityDurationTypeEnum: result.activityDurationTypeEnum,
      startTerm: result.startTerm,
      endTerm: result.endTerm,
      name: result.name,
      year: result.year,
    });
  }

  protected modelToDBMapping(model: MActivityDuration): ActivityDbUpdate {
    return {
      id: model.id,
      semesterId: model.semester.id,
      activityDurationTypeEnum: model.activityDurationTypeEnum,
      startTerm: model.startTerm,
      endTerm: model.endTerm,
    };
  }

  protected fieldMap(
    field: ActivityDurationFieldMapKeys,
  ): TableWithID | null | undefined {
    const fieldMappings: Record<
      ActivityDurationFieldMapKeys,
      TableWithID | null
    > = {
      id: ActivityD,
      semesterId: ActivityD,
      activityDurationTypeEnum: ActivityD,
      startTerm: ActivityD,
      endTerm: ActivityD,
      date: null,
    };

    if (!(field in fieldMappings)) {
      return undefined;
    }

    return fieldMappings[field];
  }

  protected processSpecialCondition(
    key: ActivityDurationFieldMapKeys,
    value: PrimitiveConditionValue,
  ): SQL {
    if (key === "date" && value instanceof Date) {
      return and(gte(ActivityD.startTerm, value), lt(ActivityD.endTerm, value));
    }

    throw new Error(`Invalid key: ${key}`);
  }
}
