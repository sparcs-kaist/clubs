import { HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";

import { ApiReg005ResponseCreated } from "@sparcs-clubs/interface/api/registration/endpoint/apiReg005";
import { ApiReg006ResponseOk } from "@sparcs-clubs/interface/api/registration/endpoint/apiReg006";
import { ApiReg007ResponseNoContent } from "@sparcs-clubs/interface/api/registration/endpoint/apiReg007";
import { ApiReg008ResponseOk } from "@sparcs-clubs/interface/api/registration/endpoint/apiReg008";
import { RegistrationStatusEnum } from "@sparcs-clubs/interface/common/enum/registration.enum";
import { and, count, eq, gt, isNotNull, isNull, or } from "drizzle-orm";
import { MySql2Database } from "drizzle-orm/mysql2";

import { getKSTDate, takeUnique } from "@sparcs-clubs/api/common/util/util";
import { DrizzleAsyncProvider } from "@sparcs-clubs/api/drizzle/drizzle.provider";
import {
  RegistrationApplicationStudent,
  RegistrationEvent,
} from "@sparcs-clubs/api/drizzle/schema/registration.schema";

@Injectable()
export class MemberRegistrationRepository {
  constructor(@Inject(DrizzleAsyncProvider) private db: MySql2Database) {}

  async isMemberRegistrationEvent(): Promise<boolean> {
    const cur = getKSTDate();
    const memberRegistrationEventEnum = 3;
    const { isAvailable } = await this.db
      .select({ isAvailable: count(RegistrationEvent.id) })
      .from(RegistrationEvent)
      .where(
        and(
          isNotNull(RegistrationEvent.endTerm),
          gt(RegistrationEvent.endTerm, cur),
          eq(
            RegistrationEvent.registrationEventEnumId,
            memberRegistrationEventEnum,
          ),
        ),
      )
      .then(takeUnique);
    if (isAvailable === 1) {
      return true;
    }
    return false;
  }

  async getMemberClubRegistrationExceptRejected(
    studentId: number,
    clubId: number,
  ) {
    const pending = RegistrationStatusEnum.Pending;
    const approved = RegistrationStatusEnum.Approved;
    console.log(`typeof pending${typeof pending}`);
    console.log(`valueof pending${pending}`);
    const { getMemberRegistration } = await this.db
      .select({
        getMemberRegistration: count(RegistrationApplicationStudent.id),
      })
      .from(RegistrationApplicationStudent)
      .where(
        and(
          or(
            eq(
              RegistrationApplicationStudent.registrationApplicationStudentEnumId,
              pending,
            ),
            eq(
              RegistrationApplicationStudent.registrationApplicationStudentEnumId,
              approved,
            ),
          ),
          eq(RegistrationApplicationStudent.clubId, clubId),
          eq(RegistrationApplicationStudent.studentId, studentId),
          isNull(RegistrationApplicationStudent.deletedAt),
        ),
      )
      .then(takeUnique);
    console.log(`count return value: ${getMemberRegistration}`);
    if (getMemberRegistration !== 0) return false;
    return true;
  }

  async postMemberRegistration(
    studentId: number,
    clubId: number,
  ): Promise<ApiReg005ResponseCreated> {
    await this.db.transaction(async tx => {
      const [result] = await tx.insert(RegistrationApplicationStudent).values({
        studentId,
        clubId,
        registrationApplicationStudentEnumId: RegistrationStatusEnum.Pending,
      });
      const { affectedRows } = result;
      if (affectedRows > 2) {
        await tx.rollback();
        throw new HttpException("Registration failed", 500);
      }
    });
    return {};
  }

  async getStudentRegistrationsMemberRegistrationsMy(
    studentId: number,
  ): Promise<ApiReg006ResponseOk> {
    const pending = RegistrationStatusEnum.Pending;
    const approved = RegistrationStatusEnum.Approved;
    const result = await this.db
      .select({
        id: RegistrationApplicationStudent.id,
        clubId: RegistrationApplicationStudent.clubId,
        applyStatusEnumId:
          RegistrationApplicationStudent.registrationApplicationStudentEnumId,
      })
      .from(RegistrationApplicationStudent)
      .where(
        and(
          or(
            eq(
              RegistrationApplicationStudent.registrationApplicationStudentEnumId,
              pending,
            ),
            eq(
              RegistrationApplicationStudent.registrationApplicationStudentEnumId,
              approved,
            ),
          ),
          eq(RegistrationApplicationStudent.studentId, studentId),
          isNull(RegistrationApplicationStudent.deletedAt),
        ),
      );
    return { applies: result };
  }

  async patchMemberRegistration(
    applyId,
    clubId,
    applyStatusEnumId,
  ): Promise<ApiReg007ResponseNoContent> {
    await this.db.transaction(async tx => {
      const [result] = await tx
        .update(RegistrationApplicationStudent)
        .set({
          registrationApplicationStudentEnumId: applyStatusEnumId,
        })
        .where(
          and(
            eq(RegistrationApplicationStudent.id, applyId),
            eq(RegistrationApplicationStudent.clubId, clubId),
            eq(
              RegistrationApplicationStudent.registrationApplicationStudentEnumId,
              RegistrationStatusEnum.Pending,
            ),
            isNull(RegistrationApplicationStudent.deletedAt),
          ),
        );
      if (result.affectedRows > 2) {
        await tx.rollback();
        throw new HttpException("Registration update failed", 500);
      } else if (result.affectedRows === 0) {
        throw new HttpException(
          "Not available application",
          HttpStatus.FORBIDDEN,
        );
      }
    });
    return {};
  }

  async getMemberRegistrationClub(clubId): Promise<ApiReg008ResponseOk> {
    const result = await this.db
      .select({
        id: RegistrationApplicationStudent.id,
        applyStatusEnumId:
          RegistrationApplicationStudent.registrationApplicationStudentEnumId,
      })
      .from(RegistrationApplicationStudent)
      .where(
        and(
          eq(RegistrationApplicationStudent.clubId, clubId),
          isNull(RegistrationApplicationStudent.deletedAt),
        ),
      );
    return { applies: result };
  }
}
