import { Injectable } from "@nestjs/common";
import { gte, lte, not, or, SQL } from "drizzle-orm";

import { BaseRepository } from "@sparcs-clubs/api/common/base/base.repository";
import { SemesterD } from "@sparcs-clubs/api/drizzle/schema/semester.schema";

import {
  MSemester,
  SemesterFromDb,
  SemesterQuery,
} from "../model/semester.model";

@Injectable()
export class SemesterRepository extends BaseRepository<
  MSemester,
  SemesterFromDb,
  typeof SemesterD,
  SemesterQuery
> {
  constructor() {
    super(SemesterD, MSemester);
  }

  protected makeWhereClause(param: SemesterQuery): SQL[] {
    const whereClause: SQL[] = super.makeWhereClause(param, [
      "duration",
      "date",
    ]);

    if (param.duration) {
      // 기간: startTerm ~ endTerm에 일부라도 포함되는 지 확인
      whereClause.push(
        not(
          or(
            lte(SemesterD.endTerm, param.duration.startTerm),
            gte(SemesterD.startTerm, param.duration.endTerm),
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
