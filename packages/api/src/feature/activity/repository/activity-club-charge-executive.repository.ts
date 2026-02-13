import { Injectable } from "@nestjs/common";

import {
  BaseRepositoryFindQuery,
  BaseRepositoryQuery,
  BaseTableFieldMapKeys,
} from "@sparcs-clubs/api/common/base/base.repository";
import { BaseSingleTableRepository } from "@sparcs-clubs/api/common/base/base.single.repository";
import {
  ActivityClubChargedExecutiveCreate,
  MActivityClubChargedExecutive,
} from "@sparcs-clubs/api/feature/activity/model/activity-club-charged-executive.model";

export type ActivityClubChargedExecutiveQuery = {
  // id: number; // id 는 기본 내장
  activityDId: number;
  clubId: number;
  executiveId: number;
};

type ActivityClubChargedExecutiveOrderByKeys = "id";
type ActivityClubChargedExecutiveQuerySupport = {}; // Query Support 용

type ActivityClubChargedExecutiveFieldMapKeys = BaseTableFieldMapKeys<
  ActivityClubChargedExecutiveQuery,
  ActivityClubChargedExecutiveOrderByKeys,
  ActivityClubChargedExecutiveQuerySupport
>;

export type ActivityClubChargedExecutiveRepositoryFindQuery =
  BaseRepositoryFindQuery<
    ActivityClubChargedExecutiveQuery,
    ActivityClubChargedExecutiveOrderByKeys
  >;
export type ActivityClubChargedExecutiveRepositoryQuery =
  BaseRepositoryQuery<ActivityClubChargedExecutiveQuery>;

@Injectable()
export class ActivityClubChargedExecutiveRepository extends BaseSingleTableRepository<
  MActivityClubChargedExecutive,
  ActivityClubChargedExecutiveCreate,
  ActivityClubChargedExecutiveQuery,
  ActivityClubChargedExecutiveOrderByKeys,
  ActivityClubChargedExecutiveQuerySupport
> {
  constructor() {
    super("activityClubChargedExecutive", MActivityClubChargedExecutive);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected dbToModelMapping(result: any): MActivityClubChargedExecutive {
    return new MActivityClubChargedExecutive({
      id: result.id,
      activityDuration: { id: result.activityDId },
      club: { id: result.clubId },
      executive: { id: result.executiveId },
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected modelToDBMapping(model: MActivityClubChargedExecutive): any {
    return {
      id: model.id,
      activityDId: model.activityDuration.id,
      clubId: model.club.id,
      executiveId: model.executive.id,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected createToDBMapping(model: ActivityClubChargedExecutiveCreate): any {
    return {
      activityDId: model.activityDuration.id,
      clubId: model.club.id,
      executiveId: model.executive.id,
    };
  }

  protected fieldMap(
    field: ActivityClubChargedExecutiveFieldMapKeys,
  ): string | null | undefined {
    const fieldMappings: Record<
      ActivityClubChargedExecutiveFieldMapKeys,
      string | null
    > = {
      id: "id",
      activityDId: "activityDId",
      clubId: "clubId",
      executiveId: "executiveId",
    };

    if (!(field in fieldMappings)) {
      return undefined;
    }

    return fieldMappings[field as keyof typeof fieldMappings];
  }
}
