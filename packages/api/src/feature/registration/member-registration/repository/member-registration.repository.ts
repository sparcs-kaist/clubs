import { HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";
import {
  and,
  count,
  eq,
  gt,
  gte,
  isNotNull,
  isNull,
  lt,
  lte,
  or,
} from "drizzle-orm";
import { MySql2Database } from "drizzle-orm/mysql2";

import { ApiReg005ResponseCreated } from "@sparcs-clubs/interface/api/registration/endpoint/apiReg005";
import { ApiReg006ResponseOk } from "@sparcs-clubs/interface/api/registration/endpoint/apiReg006";
import { ApiReg007ResponseNoContent } from "@sparcs-clubs/interface/api/registration/endpoint/apiReg007";
import { ApiReg008ResponseOk } from "@sparcs-clubs/interface/api/registration/endpoint/apiReg008";
import { ApiReg013ResponseOk } from "@sparcs-clubs/interface/api/registration/endpoint/apiReg013";
import {
  RegistrationApplicationStudentStatusEnum,
  RegistrationDeadlineEnum,
} from "@sparcs-clubs/interface/common/enum/registration.enum";

import logger from "@sparcs-clubs/api/common/util/logger";
import { getKSTDate, takeOne } from "@sparcs-clubs/api/common/util/util";
import { DrizzleAsyncProvider } from "@sparcs-clubs/api/drizzle/drizzle.provider";
import { Club, ClubT } from "@sparcs-clubs/api/drizzle/schema/club.schema";
import {
  Division,
  DivisionPermanentClubD,
} from "@sparcs-clubs/api/drizzle/schema/division.schema";
import {
  RegistrationApplicationStudent,
  RegistrationDeadlineD,
} from "@sparcs-clubs/api/drizzle/schema/registration.schema";
import {
  Student,
  StudentT,
} from "@sparcs-clubs/api/drizzle/schema/user.schema";

interface IRegistrationApplicationStudent {
  id: number;
  studentId: number;
  clubId: number;
  registrationApplicationStudentEnumId: number;
  createdAt: Date;
  deletedAt?: Date; // nullable
}

@Injectable()
export class MemberRegistrationRepository {
  constructor(@Inject(DrizzleAsyncProvider) private db: MySql2Database) {}

  async isMemberRegistrationEvent(): Promise<boolean> {
    const cur = getKSTDate();
    const memberRegistrationEventEnum =
      RegistrationDeadlineEnum.StudentRegistrationApplication;
    const { isAvailable } = await this.db
      .select({ isAvailable: count(RegistrationDeadlineD.id) })
      .from(RegistrationDeadlineD)
      .where(
        and(
          isNotNull(RegistrationDeadlineD.endDate),
          gt(RegistrationDeadlineD.endDate, cur),
          lt(RegistrationDeadlineD.startDate, cur),
          eq(
            RegistrationDeadlineD.registrationDeadlineEnumId,
            memberRegistrationEventEnum,
          ),
        ),
      )
      .then(takeOne);
    if (isAvailable === 1) {
      return true;
    }
    return false;
  }

  async getMemberClubRegistrationExceptRejected(
    studentId: number,
    clubId: number,
  ) {
    const pending = RegistrationApplicationStudentStatusEnum.Pending;
    const approved = RegistrationApplicationStudentStatusEnum.Approved;
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
      .then(takeOne);
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
        registrationApplicationStudentEnumId:
          RegistrationApplicationStudentStatusEnum.Pending,
      });
      const { affectedRows } = result;
      if (affectedRows !== 1) {
        throw new HttpException("Registration failed", 500);
      }
    });
    return {};
  }

  async getStudentRegistrationsMemberRegistrationsMy(
    studentId: number,
  ): Promise<ApiReg006ResponseOk> {
    const pending = RegistrationApplicationStudentStatusEnum.Pending;
    const approved = RegistrationApplicationStudentStatusEnum.Approved;
    const crt = getKSTDate();
    const result = await this.db
      .select({
        id: RegistrationApplicationStudent.id,
        clubId: RegistrationApplicationStudent.clubId,
        clubNameKr: Club.nameKr,
        type: ClubT.clubStatusEnumId,
        isPermanent: DivisionPermanentClubD.id,
        divisionName: Division.name,
        applyStatusEnumId:
          RegistrationApplicationStudent.registrationApplicationStudentEnumId,
      })
      .from(RegistrationApplicationStudent)
      .leftJoin(Club, eq(Club.id, RegistrationApplicationStudent.clubId))
      .innerJoin(
        ClubT,
        and(
          eq(Club.id, ClubT.clubId),
          or(
            and(isNull(ClubT.endTerm), lte(ClubT.startTerm, crt)),
            gte(ClubT.endTerm, crt),
          ),
          or(eq(ClubT.clubStatusEnumId, 1), eq(ClubT.clubStatusEnumId, 2)),
        ),
      )
      .leftJoin(
        DivisionPermanentClubD,
        and(
          eq(DivisionPermanentClubD.clubId, Club.id),
          lte(DivisionPermanentClubD.startTerm, crt),
          or(
            gte(DivisionPermanentClubD.endTerm, crt),
            isNull(DivisionPermanentClubD.endTerm),
          ),
        ),
      )
      .leftJoin(Division, eq(Division.id, Club.divisionId))
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

    return {
      applies: result.map(item => ({
        ...item,
        isPermanent: item.isPermanent !== null,
      })),
    };
  }

  async deleteMemberRegistration(
    studentId,
    applyId,
  ): Promise<ApiReg013ResponseOk> {
    const cur = getKSTDate();
    await this.db.transaction(async tx => {
      const [result] = await tx
        .update(RegistrationApplicationStudent)
        .set({
          deletedAt: cur,
        })
        .where(
          and(
            eq(RegistrationApplicationStudent.id, applyId),
            eq(RegistrationApplicationStudent.studentId, studentId),
            isNull(RegistrationApplicationStudent.deletedAt),
          ),
        );
      if (result.affectedRows > 2) {
        throw new HttpException("Registration delete failed", 500);
      } else if (result.affectedRows === 0) {
        throw new HttpException("Application Not Found", HttpStatus.NOT_FOUND);
      }
    });
    return {};
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
            isNull(RegistrationApplicationStudent.deletedAt),
          ),
        );
      if (result.affectedRows > 2) {
        throw new HttpException("Registration update failed", 500);
      } else if (result.affectedRows === 0) {
        throw new HttpException("Application Not Found", HttpStatus.NOT_FOUND);
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
        createdAt: RegistrationApplicationStudent.createdAt,
        student: {
          id: RegistrationApplicationStudent.studentId,
          name: Student.name,
          phoneNumber: Student.phoneNumber,
          email: Student.email,
          studentNumber: Student.number,
        },
      })
      .from(RegistrationApplicationStudent)
      .where(
        and(
          eq(RegistrationApplicationStudent.clubId, clubId),
          isNull(RegistrationApplicationStudent.deletedAt),
        ),
      )
      .leftJoin(
        Student,
        eq(Student.id, RegistrationApplicationStudent.studentId),
      );
    return { applies: result };
  }

  async findMemberRegistrationById(
    applyId: number,
  ): Promise<IRegistrationApplicationStudent | null> {
    const result = await this.db
      .select()
      .from(RegistrationApplicationStudent)
      .where(
        and(
          eq(RegistrationApplicationStudent.id, applyId),
          isNull(RegistrationApplicationStudent.deletedAt),
        ),
      )
      .execute();

    return result.length > 0 ? result[0] : null;
  }

  /**
   * @description getExecutiveRegistrationsMemberRegistrations 서비스를 위한
   * 전용 쿼리입니다.
   */
  async getExecutiveRegistrationsMemberRegistrations(param: {
    clubId: number;
    pageOffset: number;
    itemCount: number;
    semesterId: number;
  }) {
    const today = getKSTDate();
    const result = await this.db
      .select({
        id: RegistrationApplicationStudent.id,
        clubId: RegistrationApplicationStudent.clubId,
        clubName: Club.nameKr,
        clubTypeEnumId: ClubT.clubStatusEnumId,
        division: {
          id: Division.id,
          name: Division.name,
        },
        student: {
          id: StudentT.id,
          studentNumber: Student.number,
          StudentEnumId: StudentT.studentEnum,
          StudentStatusEnumId: StudentT.studentStatusEnum,
          name: Student.name,
          phoneNumber: Student.phoneNumber,
          email: Student.email,
        },
        registrationApplicationStudentEnumId:
          RegistrationApplicationStudent.registrationApplicationStudentEnumId,
        permanent: DivisionPermanentClubD,
      })
      .from(RegistrationApplicationStudent)
      .innerJoin(
        Club,
        and(
          eq(RegistrationApplicationStudent.clubId, Club.id),
          isNull(Club.deletedAt),
        ),
      )
      .innerJoin(
        ClubT,
        and(
          eq(RegistrationApplicationStudent.clubId, ClubT.clubId),
          eq(ClubT.semesterId, param.semesterId),
          isNull(ClubT.deletedAt),
        ),
      )
      .innerJoin(
        Division,
        and(eq(Club.divisionId, Division.id), isNull(Division.deletedAt)),
      )
      .innerJoin(
        StudentT,
        and(
          eq(StudentT.studentId, RegistrationApplicationStudent.studentId),
          eq(StudentT.semesterId, param.semesterId),
          isNull(StudentT.deletedAt),
        ),
      )
      .innerJoin(
        Student,
        and(
          eq(RegistrationApplicationStudent.studentId, Student.id),
          isNull(Student.deletedAt),
        ),
      )
      .leftJoin(
        DivisionPermanentClubD,
        and(
          isNull(DivisionPermanentClubD.deletedAt),
          eq(Club.id, DivisionPermanentClubD.clubId),
          lte(DivisionPermanentClubD.startTerm, today),
          or(
            isNull(DivisionPermanentClubD.endTerm),
            gte(DivisionPermanentClubD.endTerm, today),
          ),
        ),
      )
      .where(
        and(
          eq(RegistrationApplicationStudent.clubId, param.clubId),
          isNull(RegistrationApplicationStudent.deletedAt),
        ),
      );
    logger.debug(result.length);
    return result;
  }

  /**
   * @description getExecutiveRegistrationsMemberRegistrationsBrief 서비스를 위한
   * 전용 쿼리입니다.
   */
  async getExecutiveRegistrationsMemberRegistrationsBrief(param: {
    pageOffset: number;
    itemCount: number;
    semesterId: number;
  }) {
    const today = getKSTDate();
    const result = await this.db
      .select({
        clubId: RegistrationApplicationStudent.clubId,
        clubName: Club.nameKr,
        clubTypeEnumId: ClubT.clubStatusEnumId,
        division: {
          id: Division.id,
          name: Division.name,
        },
        student: {
          StudentEnumId: StudentT.studentEnum,
          StudentStatusEnumId: StudentT.studentStatusEnum,
        },
        registrationApplicationStudentEnumId:
          RegistrationApplicationStudent.registrationApplicationStudentEnumId,
        permanent: DivisionPermanentClubD,
      })
      .from(RegistrationApplicationStudent)
      .innerJoin(
        Club,
        and(
          eq(RegistrationApplicationStudent.clubId, Club.id),
          isNull(Club.deletedAt),
        ),
      )
      .innerJoin(
        ClubT,
        and(
          eq(RegistrationApplicationStudent.clubId, ClubT.clubId),
          eq(ClubT.semesterId, param.semesterId),
          isNull(ClubT.deletedAt),
        ),
      )
      .innerJoin(
        Division,
        and(eq(Club.divisionId, Division.id), isNull(Division.deletedAt)),
      )
      .innerJoin(
        StudentT,
        and(
          eq(StudentT.studentId, RegistrationApplicationStudent.studentId),
          eq(StudentT.semesterId, param.semesterId),
          isNull(StudentT.deletedAt),
        ),
      )
      .leftJoin(
        DivisionPermanentClubD,
        and(
          isNull(DivisionPermanentClubD.deletedAt),
          eq(Club.id, DivisionPermanentClubD.clubId),
          lte(DivisionPermanentClubD.startTerm, today),
          or(
            isNull(DivisionPermanentClubD.endTerm),
            gte(DivisionPermanentClubD.endTerm, today),
          ),
        ),
      )
      .where(and(isNull(RegistrationApplicationStudent.deletedAt)));
    logger.debug(result.length);
    return result;
  }
}
