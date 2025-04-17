import { Injectable } from "@nestjs/common";
import { gte, lte, not, or, SQL } from "drizzle-orm";

import { BaseRepository } from "@sparcs-clubs/api/common/base/base.repository";
import { RegistrationDeadlineD } from "@sparcs-clubs/api/drizzle/schema/semester.schema";

import {
  MRegistrationDeadline,
  RegistrationDeadlineFromDb,
  RegistrationDeadlineQuery,
} from "../model/registration.deadline.model";

@Injectable()
export class RegistrationDeadlineRepository extends BaseRepository<
  MRegistrationDeadline,
  RegistrationDeadlineFromDb,
  typeof RegistrationDeadlineD,
  RegistrationDeadlineQuery
> {
  constructor() {
    super(RegistrationDeadlineD, MRegistrationDeadline);
  }

  protected makeWhereClause(param: RegistrationDeadlineQuery): SQL[] {
    const whereClause: SQL[] = super.makeWhereClause(param, [
      "duration",
      "date",
    ]);

    if (param.duration) {
      // 기간: startTerm ~ endTerm에 일부라도 포함되는 지 확인
      whereClause.push(
        not(
          or(
            lte(RegistrationDeadlineD.endTerm, param.duration.startTerm),
            gte(RegistrationDeadlineD.startTerm, param.duration.endTerm),
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
