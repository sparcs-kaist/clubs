import { Injectable } from "@nestjs/common";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";

import { ActivityStatusEnum } from "@clubs/domain/activity/activity";

import {
  BaseTableFieldMapKeys,
  TableWithID,
} from "@sparcs-clubs/api/common/base/base.repository";
import { BaseSingleTableRepository } from "@sparcs-clubs/api/common/base/base.single.repository";
import { ActivityFeedback } from "@sparcs-clubs/api/drizzle/schema/activity.schema";
import {
  IActivityCommentCreate,
  MActivityComment,
} from "@sparcs-clubs/api/feature/activity/model/activity-comment.model";

export type ActivityCommentQuery = {
  activityId: number;
  activityStatusEnum: ActivityStatusEnum;
};

type ActivityCommentOrderByKeys = "id" | "createdAt";
type ActivityCommentQuerySupport = {};

type ActivityCommentTable = typeof ActivityFeedback;
type ActivityDbSelect = InferSelectModel<ActivityCommentTable>;
type ActivityDbUpdate = Partial<ActivityDbSelect>;
type ActivityCommentDbInsert = InferInsertModel<ActivityCommentTable>;
type ActivityCommentFieldMapKeys = BaseTableFieldMapKeys<
  ActivityCommentQuery,
  ActivityCommentOrderByKeys,
  ActivityCommentQuerySupport
>;

@Injectable()
export class ActivityCommentRepository extends BaseSingleTableRepository<
  MActivityComment,
  IActivityCommentCreate,
  ActivityCommentTable,
  ActivityCommentQuery,
  ActivityCommentOrderByKeys,
  ActivityCommentQuerySupport
> {
  constructor() {
    super(ActivityFeedback, MActivityComment);
  }

  protected dbToModelMapping(result: ActivityDbSelect): MActivityComment {
    return new MActivityComment({
      id: result.id,
      activity: { id: result.activityId },
      executive: { id: result.executiveId },
      content: result.comment,
      activityStatusEnum: result.activityStatusEnum,
      createdAt: result.createdAt,
    });
  }

  protected modelToDBMapping(model: MActivityComment): ActivityDbUpdate {
    return {
      id: model.id,
      activityId: model.activity.id,
      executiveId: model.executive.id,
      comment: model.content,
      activityStatusEnum: model.activityStatusEnum,
      createdAt: model.createdAt,
    };
  }

  protected createToDBMapping(
    model: IActivityCommentCreate,
  ): ActivityCommentDbInsert {
    return {
      activityId: model.activity.id,
      executiveId: model.executive.id,
      comment: model.content,
      activityStatusEnum: model.activityStatusEnum,
    };
  }

  protected fieldMap(
    field: ActivityCommentFieldMapKeys,
  ): TableWithID | null | undefined {
    const fieldMappings: Record<
      ActivityCommentFieldMapKeys,
      TableWithID | null
    > = {
      id: ActivityFeedback,
      activityId: ActivityFeedback,
      activityStatusEnum: ActivityFeedback,
      createdAt: ActivityFeedback,
    };

    if (!(field in fieldMappings)) {
      return undefined;
    }

    return fieldMappings[field];
  }
}
