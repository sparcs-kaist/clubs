import { Injectable } from "@nestjs/common";
import { gte, lte, not, or, SQL } from "drizzle-orm";

import { BaseRepository } from "@sparcs-clubs/api/common/base/base.repository";
import { FundingDeadlineD } from "@sparcs-clubs/api/drizzle/schema/semester.schema";

import {
  FundingDeadlineFromDb,
  FundingDeadlineQuery,
  MFundingDeadline,
} from "../model/funding.deadline.model";

@Injectable()
export class FundingDeadlineRepository extends BaseRepository<
  MFundingDeadline,
  FundingDeadlineFromDb,
  typeof FundingDeadlineD,
  FundingDeadlineQuery
> {
  constructor() {
    super(FundingDeadlineD, MFundingDeadline);
  }

  protected makeWhereClause(param: FundingDeadlineQuery): SQL[] {
    const whereClause: SQL[] = super.makeWhereClause(param, [
      "duration",
      "date",
    ]);

    if (param.duration) {
      // 기간: startTerm ~ endTerm에 일부라도 포함되는 지 확인
      whereClause.push(
        not(
          or(
            lte(FundingDeadlineD.endTerm, param.duration.startTerm),
            gte(FundingDeadlineD.startTerm, param.duration.endTerm),
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
