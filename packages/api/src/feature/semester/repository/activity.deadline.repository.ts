import { Injectable } from "@nestjs/common";
import { gte, lte, not, or, SQL } from "drizzle-orm";

import { BaseRepository } from "@sparcs-clubs/api/common/repository/base.repository";
import { ActivityDeadlineD } from "@sparcs-clubs/api/drizzle/schema/semester.schema";

import {
  ActivityDeadlineFromDb,
  ActivityDeadlineQuery,
  MActivityDeadline,
} from "../model/activity.deadline.model";

@Injectable()
export class ActivityDeadlineRepository extends BaseRepository<
  MActivityDeadline,
  ActivityDeadlineFromDb,
  typeof ActivityDeadlineD,
  ActivityDeadlineQuery
> {
  constructor() {
    super(ActivityDeadlineD, MActivityDeadline);
  }

  protected makeWhereClause(param: ActivityDeadlineQuery): SQL[] {
    const whereClause: SQL[] = super.makeWhereClause(param, [
      "duration",
      "date",
    ]);

    if (param.duration) {
      // 기간: startTerm ~ endTerm에 일부라도 포함되는 지 확인
      whereClause.push(
        not(
          or(
            lte(ActivityDeadlineD.endTerm, param.duration.startTerm),
            gte(ActivityDeadlineD.startTerm, param.duration.endTerm),
          ),
        ),
      );
    }

    // date: date를 startTerm, endTerm에 포함하는 지 확인
    if (param.date) {
      whereClause.push(
        this.processNestedQuery({
          and: {
            startTerm: { lte: param.date },
            endTerm: { gt: param.date },
          },
        }),
      );
    }

    return whereClause;
  }
}
