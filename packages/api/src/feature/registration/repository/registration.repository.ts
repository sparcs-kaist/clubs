import { Inject, Injectable } from "@nestjs/common";
import { ApiReg001RequestBody } from "@sparcs-clubs/interface/api/registration/endpoint/apiReg001";
import { ApiReg004ResponseOK } from "@sparcs-clubs/interface/api/registration/endpoint/apiReg004";
import { and, count, desc, eq, isNull } from "drizzle-orm";
import { MySql2Database } from "drizzle-orm/mysql2";

import logger from "@sparcs-clubs/api/common/util/logger";
import { takeUnique } from "@sparcs-clubs/api/common/util/util";
import { DrizzleAsyncProvider } from "src/drizzle/drizzle.provider";
import {
  Registration,
  RegistrationEventD,
  RegistrationEventEnum,
} from "src/drizzle/schema/registration.schema";

@Injectable()
export class RegistrationRepository {
  constructor(@Inject(DrizzleAsyncProvider) private db: MySql2Database) {}

  async findByClubId(clubId: number) {
    const clubs = await this.db
      .select()
      .from(Registration)
      .where(
        and(eq(Registration.clubId, clubId), isNull(Registration.deletedAt)),
      );

    return clubs;
  }

  async createRegistration(body: ApiReg001RequestBody) {
    await this.db.transaction(async tx => {
      const [registrationInsertResult] = await tx.insert(Registration).values({
        clubId: body.clubId,
        registrationApplicationTypeEnumId: body.registrationTypeEnumId,
        clubNameKr: body.krName,
        clubNameEn: body.enName,
        studentId: body.studentId,
        studentPhoneNumber: body.phoneNumber,
        foundedAt: body.foundedAt,
        divisionId: body.divisionId,
        activityFieldKr: body.kr활동분야,
        activityFieldEn: body.en활동분야,
        professorId: body.professor?.ProfessorEnumId,
        divisionConsistency: body.divisionIntegrity,
        foundationPurpose: body.foundationPurpose,
        activityPlan: body.activityPlan,
        // clubRuleFileId: body.clubRuleFileId,
        // externalInstructionFileId: body.externalInstructionFileId,
        // activityId: body.activityId,
        registrationApplicationStatusEnumId: 1, // Example status ID
      });

      if (registrationInsertResult.affectedRows !== 1) {
        logger.debug("[createRegistration] rollback occurs");
        tx.rollback();
      }

      logger.debug(
        `[createRegistration] Registration inserted with id ${registrationInsertResult.insertId}`,
      );
    });

    logger.debug("[createRegistration] insertion ends successfully");
  }

  async getStudentRegistrationEvents(): Promise<ApiReg004ResponseOK> {
    const { eventEnumCount } = await this.db
      .select({ eventEnumCount: count(RegistrationEventEnum.enumId) })
      .from(RegistrationEventEnum)
      .where(isNull(RegistrationEventEnum.deletedAt))
      .then(takeUnique);
    const result = await this.db
      .select({
        id: RegistrationEventD.id,
        registrationEventEnumId: RegistrationEventD.registrationEventEnumId,
        startTerm: RegistrationEventD.startTerm,
        endTerm: RegistrationEventD.endTerm,
      })
      .from(RegistrationEventD)
      .orderBy(desc(RegistrationEventD.startTerm))
      .limit(eventEnumCount);
    return { events: result };
  }
}
