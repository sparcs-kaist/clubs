import { Inject, Injectable } from "@nestjs/common";
import { count, desc, isNull } from "drizzle-orm";
import { MySql2Database } from "drizzle-orm/mysql2";
import { DrizzleAsyncProvider } from "src/drizzle/drizzle.provider";
import {
  RegistrationDeadlineD,
  RegistrationDeadlineEnum,
} from "src/drizzle/schema/registration.schema";

import { ApiReg004ResponseOK } from "@sparcs-clubs/interface/api/registration/endpoint/apiReg004";

import { takeOne } from "@sparcs-clubs/api/common/util/util";

@Injectable()
export class RegistrationRepository {
  constructor(@Inject(DrizzleAsyncProvider) private db: MySql2Database) {}

  async getStudentRegistrationEvents(): Promise<ApiReg004ResponseOK> {
    const { eventEnumCount } = await this.db
      .select({ eventEnumCount: count(RegistrationDeadlineEnum.enumId) })
      .from(RegistrationDeadlineEnum)
      .where(isNull(RegistrationDeadlineEnum.deletedAt))
      .then(takeOne);
    const result = await this.db
      .select({
        id: RegistrationDeadlineD.id,
        registrationEventEnumId:
          RegistrationDeadlineD.registrationDeadlineEnumId,
        startTerm: RegistrationDeadlineD.startDate,
        endTerm: RegistrationDeadlineD.endDate,
      })
      .from(RegistrationDeadlineD)
      .orderBy(desc(RegistrationDeadlineD.startDate))
      .limit(eventEnumCount);
    return { events: result };
  }
}
