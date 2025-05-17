import { Injectable } from "@nestjs/common";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";

import {
  BaseRepositoryFindQuery,
  BaseRepositoryQuery,
  BaseTableFieldMapKeys,
  TableWithID,
} from "@sparcs-clubs/api/common/base/base.repository";
import { BaseSingleTableRepository } from "@sparcs-clubs/api/common/base/base.single.repository";
import { ActivityClubChargedExecutive } from "@sparcs-clubs/api/drizzle/schema/activity.schema";
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

type ActivityClubChargedExecutiveTable = typeof ActivityClubChargedExecutive;
type ActivityClubChargedExecutiveDbSelect =
  InferSelectModel<ActivityClubChargedExecutiveTable>;
type ActivityClubChargedExecutiveDbUpdate =
  Partial<ActivityClubChargedExecutiveDbSelect>;
type ActivityClubChargedExecutiveDbInsert =
  InferInsertModel<ActivityClubChargedExecutiveTable>;

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
  ActivityClubChargedExecutiveTable,
  ActivityClubChargedExecutiveQuery,
  ActivityClubChargedExecutiveOrderByKeys,
  ActivityClubChargedExecutiveQuerySupport
> {
  constructor() {
    super(ActivityClubChargedExecutive, MActivityClubChargedExecutive);
  }

  protected dbToModelMapping(
    result: ActivityClubChargedExecutiveDbSelect,
  ): MActivityClubChargedExecutive {
    return new MActivityClubChargedExecutive({
      id: result.id,
      activityDuration: { id: result.activityDId },
      club: { id: result.clubId },
      executive: { id: result.executiveId },
    });
  }

  protected modelToDBMapping(
    model: MActivityClubChargedExecutive,
  ): ActivityClubChargedExecutiveDbUpdate {
    return {
      id: model.id,
      activityDId: model.activityDuration.id,
      clubId: model.club.id,
      executiveId: model.executive.id,
    };
  }

  protected createToDBMapping(
    model: ActivityClubChargedExecutiveCreate,
  ): ActivityClubChargedExecutiveDbInsert {
    return {
      activityDId: model.activityDuration.id,
      clubId: model.club.id,
      executiveId: model.executive.id,
    };
  }

  protected fieldMap(
    field: ActivityClubChargedExecutiveFieldMapKeys,
  ): TableWithID | null | undefined {
    const fieldMappings: Record<
      ActivityClubChargedExecutiveFieldMapKeys,
      TableWithID | null
    > = {
      id: ActivityClubChargedExecutive,
      activityDId: ActivityClubChargedExecutive,
      clubId: ActivityClubChargedExecutive,
      executiveId: ActivityClubChargedExecutive,
    };

    if (!(field in fieldMappings)) {
      return undefined;
    }

    return fieldMappings[field];
  }
}
