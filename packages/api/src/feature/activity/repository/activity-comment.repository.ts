import { Injectable } from "@nestjs/common";

import { ActivityStatusEnum } from "@clubs/domain/activity/activity";

import { BaseTableFieldMapKeys } from "@sparcs-clubs/api/common/base/base.repository";
import { BaseSingleTableRepository } from "@sparcs-clubs/api/common/base/base.single.repository";
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

type ActivityCommentFieldMapKeys = BaseTableFieldMapKeys<
  ActivityCommentQuery,
  ActivityCommentOrderByKeys,
  ActivityCommentQuerySupport
>;

@Injectable()
export class ActivityCommentRepository extends BaseSingleTableRepository<
  MActivityComment,
  IActivityCommentCreate,
  ActivityCommentQuery,
  ActivityCommentOrderByKeys,
  ActivityCommentQuerySupport
> {
  constructor() {
    super("activityFeedback", MActivityComment);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected dbToModelMapping(result: any): MActivityComment {
    return new MActivityComment({
      id: result.id,
      activity: { id: result.activityId },
      executive: { id: result.executiveId },
      content: result.comment,
      activityStatusEnum: result.activityStatusEnum,
      createdAt: result.createdAt,
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected modelToDBMapping(model: MActivityComment): any {
    return {
      id: model.id,
      activityId: model.activity.id,
      executiveId: model.executive.id,
      comment: model.content,
      activityStatusEnum: model.activityStatusEnum,
      createdAt: model.createdAt,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected createToDBMapping(model: IActivityCommentCreate): any {
    return {
      activityId: model.activity.id,
      executiveId: model.executive.id,
      comment: model.content,
      activityStatusEnum: model.activityStatusEnum,
    };
  }

  protected fieldMap(
    field: ActivityCommentFieldMapKeys,
  ): string | null | undefined {
    const fieldMappings: Record<ActivityCommentFieldMapKeys, string | null> = {
      id: "id",
      activityId: "activityId",
      activityStatusEnum: "activityStatusEnum",
      createdAt: "createdAt",
    };

    if (!(field in fieldMappings)) {
      return undefined;
    }

    return fieldMappings[field as keyof typeof fieldMappings];
  }
}
