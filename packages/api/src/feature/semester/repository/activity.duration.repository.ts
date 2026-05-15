import { Injectable } from "@nestjs/common";

import { ActivityDurationTypeEnum } from "@clubs/domain/semester/activity-duration";

import {
  BaseTableFieldMapKeys,
  PrimitiveConditionValue,
} from "@sparcs-clubs/api/common/base/base.repository";
import { BaseSingleTableRepository } from "@sparcs-clubs/api/common/base/base.single.repository";
import { MActivity } from "@sparcs-clubs/api/feature/activity/model/activity.model.new";
import {
  IActivityDurationCreate,
  MActivityDuration,
} from "@sparcs-clubs/api/feature/semester/model/activity.duration.model";

export type ActivityDurationQuery = {
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

type ActivityDurationFieldMapKeys = BaseTableFieldMapKeys<
  ActivityDurationQuery,
  ActivityDurationOrderByKeys,
  ActivityDurationQuerySupport
>;

@Injectable()
export class ActivityDurationRepository extends BaseSingleTableRepository<
  MActivityDuration,
  IActivityDurationCreate,
  ActivityDurationQuery,
  ActivityDurationOrderByKeys,
  ActivityDurationQuerySupport
> {
  constructor() {
    super("activityD", MActivityDuration);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected dbToModelMapping(result: any): MActivityDuration {
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected modelToDBMapping(model: MActivityDuration): any {
    return {
      id: model.id,
      semesterId: model.semester.id,
      activityDurationTypeEnum: model.activityDurationTypeEnum,
      startTerm: model.startTerm,
      endTerm: model.endTerm,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected createToDBMapping(model: IActivityDurationCreate): any {
    return {
      semesterId: model.semester.id,
      activityDurationTypeEnum: model.activityDurationTypeEnum,
      startTerm: model.startTerm,
      endTerm: model.endTerm,
      name: model.name,
      year: model.year,
    };
  }

  protected fieldMap(
    field: ActivityDurationFieldMapKeys,
  ): string | null | undefined {
    const fieldMappings: Record<ActivityDurationFieldMapKeys, string | null> = {
      id: "id",
      semesterId: "semesterId",
      activityDurationTypeEnum: "activityDurationTypeEnum",
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
    key: ActivityDurationFieldMapKeys,
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

  async findActivitiesByDurationId(
    activityDurationId: MActivityDuration["id"],
  ): Promise<MActivity[]> {
    const activities = await this.prisma.activity.findMany({
      where: {
        activityDId: activityDurationId,
        deletedAt: null,
      },
      include: {
        activityTs: {
          where: {
            deletedAt: null,
          },
        },
      },
    });

    return activities.map(
      activity =>
        new MActivity({
          id: activity.id,
          club: { id: activity.clubId },
          name: activity.name,
          activityTypeEnum: activity.activityTypeEnumId,
          activityStatusEnum: activity.activityStatusEnumId,
          activityDuration: { id: activity.activityDId },
          durations: activity.activityTs.map(duration => ({
            startTerm: duration.startTerm,
            endTerm: duration.endTerm,
          })),
          location: activity.location,
          purpose: activity.purpose,
          detail: activity.detail,
          evidence: activity.evidence,
          evidenceFiles: [],
          participants: [],
          chargedExecutive: activity.chargedExecutiveId
            ? { id: activity.chargedExecutiveId }
            : null,
          editedAt: activity.editedAt,
          professorApprovedAt: activity.professorApprovedAt,
          commentedAt: activity.commentedAt,
          commentedExecutive: activity.commentedExecutiveId
            ? { id: activity.commentedExecutiveId }
            : null,
        }),
    );
  }
}
