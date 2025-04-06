import { Injectable } from "@nestjs/common";
import { gte, lte, not, or, SQL } from "drizzle-orm";

import { BaseRepository } from "@sparcs-clubs/api/common/repository/base.repository";
import { ActivityD } from "@sparcs-clubs/api/drizzle/schema/semester.schema";

import {
  ActivityDurationFromDb,
  ActivityDurationQuery,
  MActivityDuration,
} from "../model/activity.duration.model";

@Injectable()
export class ActivityDurationRepository extends BaseRepository<
  MActivityDuration,
  ActivityDurationFromDb,
  typeof ActivityD,
  ActivityDurationQuery
> {
  constructor() {
    super(ActivityD, MActivityDuration);
  }

  protected makeWhereClause(param: ActivityDurationQuery): SQL[] {
    const whereClause: SQL[] = super.makeWhereClause(param, [
      "duration",
      "date",
    ]);

    if (param.duration) {
      // 기간: startTerm ~ endTerm에 일부라도 포함되는 지 확인
      whereClause.push(
        not(
          or(
            lte(ActivityD.endTerm, param.duration.startTerm),
            gte(ActivityD.startTerm, param.duration.endTerm),
          ),
        ),
      );
    }

    // date: date를 startTerm, endTerm에 포함하는 지 확인
    if (param.date) {
      whereClause.push(
        this.processNestedQuery(
          {
            startTerm: { lte: param.date },
            endTerm: { gt: param.date },
          },
          "and",
        ),
      );
    }

    return whereClause;
  }
}
