import { HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";
import {
  ApiReg001RequestBody,
  ApiReg001ResponseCreated,
} from "@sparcs-clubs/interface/api/registration/endpoint/apiReg001";
import {
  ApiReg009RequestBody,
  ApiReg009ResponseOk,
} from "@sparcs-clubs/interface/api/registration/endpoint/apiReg009";
import { ApiReg010ResponseOk } from "@sparcs-clubs/interface/api/registration/endpoint/apiReg010";
import { ApiReg011ResponseOk } from "@sparcs-clubs/interface/api/registration/endpoint/apiReg011";
import { ApiReg012ResponseOk } from "@sparcs-clubs/interface/api/registration/endpoint/apiReg012";
import { ApiReg014ResponseOk } from "@sparcs-clubs/interface/api/registration/endpoint/apiReg014";
import { ApiReg015ResponseOk } from "@sparcs-clubs/interface/api/registration/endpoint/apiReg015";
import { ApiReg016ResponseOk } from "@sparcs-clubs/interface/api/registration/endpoint/apiReg016";
import { ApiReg017ResponseCreated } from "@sparcs-clubs/interface/api/registration/endpoint/apiReg017";
import {
  RegistrationDeadlineEnum,
  RegistrationStatusEnum,
  RegistrationTypeEnum,
} from "@sparcs-clubs/interface/common/enum/registration.enum";
import {
  and,
  count,
  desc,
  eq,
  gt,
  gte,
  inArray,
  isNull,
  lte,
  or,
  sql,
} from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";
import { MySql2Database } from "drizzle-orm/mysql2";

import logger from "@sparcs-clubs/api/common/util/logger";
import { getKSTDate, takeUnique } from "@sparcs-clubs/api/common/util/util";
import { DrizzleAsyncProvider } from "@sparcs-clubs/api/drizzle/drizzle.provider";
import { ClubDelegateD } from "@sparcs-clubs/api/drizzle/schema/club.schema";
import { File } from "@sparcs-clubs/api/drizzle/schema/file.schema";
import {
  Registration,
  RegistrationDeadlineD,
  RegistrationExecutiveComment,
} from "@sparcs-clubs/api/drizzle/schema/registration.schema";
import {
  Professor,
  ProfessorT,
  Student,
  StudentT,
} from "@sparcs-clubs/api/drizzle/schema/user.schema";

@Injectable()
export class ClubRegistrationRepository {
  constructor(@Inject(DrizzleAsyncProvider) private db: MySql2Database) {}

  async selectDeadlineByDate(
    date: Date,
    enums: Array<RegistrationDeadlineEnum>,
  ) {
    const result = await this.db
      .select()
      .from(RegistrationDeadlineD)
      .where(
        and(
          lte(RegistrationDeadlineD.startDate, date),
          gt(RegistrationDeadlineD.endDate, date),
          inArray(RegistrationDeadlineD.registrationDeadlineEnumId, enums),
          isNull(RegistrationDeadlineD.deletedAt),
        ),
      );
    return result;
  }

  async findByClubId(clubId: number) {
    const clubs = await this.db
      .select()
      .from(Registration)
      .where(
        and(eq(Registration.clubId, clubId), isNull(Registration.deletedAt)),
      );

    return clubs;
  }

  async createRegistration(
    studentId: number,
    body: ApiReg001RequestBody,
  ): Promise<ApiReg001ResponseCreated> {
    const cur = getKSTDate();
    await this.db.transaction(async tx => {
      if (body.registrationTypeEnumId !== RegistrationTypeEnum.NewProvisional) {
        const delegate = await tx
          .select({
            clubId: ClubDelegateD.clubId,
            studentId: ClubDelegateD.studentId,
          })
          .from(ClubDelegateD)
          .where(
            and(
              eq(ClubDelegateD.studentId, studentId),
              eq(ClubDelegateD.clubId, body.clubId),
              lte(ClubDelegateD.startTerm, cur),
              or(
                gte(ClubDelegateD.endTerm, cur),
                isNull(ClubDelegateD.endTerm),
              ),
              isNull(ClubDelegateD.deletedAt),
            ),
          )
          .for("share")
          .then(takeUnique);
        if (!delegate) {
          await tx.rollback();
          throw new HttpException(
            "Student is not delegate of the club",
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      let professorId;
      if (body.professor) {
        professorId = await tx
          .select({
            professorId: Professor.id,
          })
          .from(Professor)
          .leftJoin(
            ProfessorT,
            and(
              eq(Professor.id, ProfessorT.professorId),
              eq(ProfessorT.professorEnum, body.professor.professorEnumId),
              isNull(ProfessorT.deletedAt),
              lte(ProfessorT.startTerm, cur),
              or(isNull(ProfessorT.endTerm), gt(ProfessorT.endTerm, cur)),
            ),
          )
          .where(
            and(
              eq(Professor.email, body.professor.email),
              eq(Professor.name, body.professor.name),
              isNull(Professor.deletedAt),
            ),
          )
          .for("share")
          .then(takeUnique);
        if (!professorId) {
          await tx.rollback();
          throw new HttpException(
            "Professor Not Found",
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      const [registrationInsertResult] = await tx.insert(Registration).values({
        clubId: body.clubId,
        registrationApplicationTypeEnumId: body.registrationTypeEnumId,
        clubNameKr: body.clubNameKr,
        clubNameEn: body.clubNameEn,
        studentId,
        phoneNumber: body.phoneNumber,
        foundedAt: body.foundedAt,
        divisionId: body.divisionId,
        activityFieldKr: body.activityFieldKr,
        activityFieldEn: body.activityFieldEn,
        professorId,
        divisionConsistency: body.divisionConsistency,
        foundationPurpose: body.foundationPurpose,
        activityPlan: body.activityPlan,
        registrationActivityPlanFileId: body.activityPlanFileId,
        registrationClubRuleFileId: body.clubRuleFileId,
        registrationExternalInstructionFileId: body.externalInstructionFileId,
        registrationApplicationStatusEnumId: RegistrationStatusEnum.Pending,
      });

      if (registrationInsertResult.affectedRows !== 1) {
        logger.debug("[createRegistration] rollback occurs");
        await tx.rollback();
      }

      logger.debug(
        `[createRegistration] Registration inserted with id ${registrationInsertResult.insertId}`,
      );
    });

    logger.debug("[createRegistration] insertion ends successfully");
    return {};
  }

  async putStudentRegistrationsClubRegistration(
    studentId: number,
    applyId: number,
    body: ApiReg009RequestBody,
  ): Promise<ApiReg009ResponseOk> {
    const cur = getKSTDate();
    await this.db.transaction(async tx => {
      const registration = await tx
        .select({
          RegistrationStatusEnum:
            Registration.registrationApplicationStatusEnumId,
        })
        .from(Registration)
        .where(
          and(
            eq(Registration.id, applyId),
            body.clubId === undefined
              ? undefined
              : eq(Registration.clubId, body.clubId),
            eq(
              Registration.registrationApplicationTypeEnumId,
              body.registrationTypeEnumId,
            ),
            eq(Registration.studentId, studentId),
            isNull(Registration.deletedAt),
          ),
        )
        .for("update")
        .then(takeUnique);
      if (
        !registration ||
        registration.RegistrationStatusEnum === RegistrationStatusEnum.Approved
      ) {
        await tx.rollback();
        throw new HttpException(
          "No registration found",
          HttpStatus.BAD_REQUEST,
        );
      }
      let professorId;
      if (body.professor) {
        professorId = await tx
          .select({
            professorId: Professor.id,
          })
          .from(Professor)
          .leftJoin(
            ProfessorT,
            and(
              eq(Professor.id, ProfessorT.professorId),
              eq(ProfessorT.professorEnum, body.professor.professorEnumId),
              isNull(ProfessorT.deletedAt),
              lte(ProfessorT.startTerm, cur),
              or(isNull(ProfessorT.endTerm), gt(ProfessorT.endTerm, cur)),
            ),
          )
          .where(
            and(
              eq(Professor.email, body.professor.email),
              eq(Professor.name, body.professor.name),
              isNull(Professor.deletedAt),
            ),
          )
          .for("share")
          .then(takeUnique);
        if (!professorId) {
          await tx.rollback();
          throw new HttpException(
            "Professor Not Found",
            HttpStatus.BAD_REQUEST,
          );
        }
      }
      const [result] = await tx
        .update(Registration)
        .set({
          clubNameKr: body.clubNameKr,
          clubNameEn: body.clubNameEn,
          phoneNumber: body.phoneNumber,
          foundedAt: body.foundedAt,
          divisionId: body.divisionId,
          activityFieldKr: body.activityFieldKr,
          activityFieldEn: body.activityFieldEn,
          professorId,
          divisionConsistency: body.divisionConsistency,
          foundationPurpose: body.foundationPurpose,
          activityPlan: body.activityPlan,
          registrationActivityPlanFileId: body.activityPlanFileId,
          registrationClubRuleFileId: body.clubRuleFileId,
          registrationExternalInstructionFileId: body.externalInstructionFileId,
          updatedAt: cur,
        })
        .where(
          and(
            eq(Registration.id, applyId),
            eq(Registration.studentId, studentId),
            isNull(Registration.deletedAt),
          ),
        );
      if (result.affectedRows !== 1) {
        await tx.rollback();
        throw new HttpException("Registration update failed", 500);
      }
    });
    return {};
  }

  async deleteStudentRegistrationsClubRegistration(
    studentId: number,
    applyId: number,
  ): Promise<ApiReg010ResponseOk> {
    const cur = getKSTDate();
    await this.db.transaction(async tx => {
      const [result] = await tx
        .update(Registration)
        .set({
          deletedAt: cur,
        })
        .where(
          and(
            eq(Registration.id, applyId),
            eq(Registration.studentId, studentId),
            isNull(Registration.deletedAt),
          ),
        );
      if (result.affectedRows !== 1) {
        await tx.rollback();
        throw new HttpException("Registration delete failed", 500);
      }
    });
    return {};
  }

  async getStudentRegistrationsClubRegistration(
    studentId: number,
    applyId: number,
  ): Promise<ApiReg011ResponseOk> {
    const cur = getKSTDate();
    const result = await this.db.transaction(async tx => {
      const File1 = alias(File, "File1");
      const File2 = alias(File, "File2");
      const File3 = alias(File, "File3");
      const registration = await tx
        .select({
          id: Registration.id,
          registrationTypeEnumId:
            Registration.registrationApplicationTypeEnumId,
          registrationStatusEnumId:
            Registration.registrationApplicationStatusEnumId,
          clubId: Registration.clubId,
          clubNameKr: Registration.clubNameKr,
          clubNameEn: Registration.clubNameEn,
          studentId: Registration.studentId,
          phoneNumber: Registration.phoneNumber,
          foundedAt: Registration.foundedAt,
          divisionId: Registration.divisionId,
          activityFieldKr: Registration.activityFieldKr,
          activityFieldEn: Registration.activityFieldEn,
          professor: Registration.professorId,
          divisionConsistency: Registration.divisionConsistency,
          foundationPurpose: Registration.foundationPurpose,
          activityPlan: Registration.activityPlan,
          activityPlanFileId: Registration.registrationActivityPlanFileId,
          activityPlanFileName: File1.name,
          clubRuleFileId: Registration.registrationClubRuleFileId,
          clubRuleFileName: File2.name,
          externalInstructionFileId:
            Registration.registrationExternalInstructionFileId,
          externalInstructionFileName: File3.name,
        })
        .from(Registration)
        .leftJoin(
          File1,
          and(
            eq(Registration.registrationActivityPlanFileId, File1.id),
            isNull(File1.deletedAt),
          ),
        )
        .leftJoin(
          File2,
          and(
            eq(Registration.registrationClubRuleFileId, File2.id),
            isNull(File2.deletedAt),
          ),
        )
        .leftJoin(
          File3,
          and(
            eq(Registration.registrationExternalInstructionFileId, File3.id),
            isNull(File3.deletedAt),
          ),
        )
        .where(
          and(
            eq(Registration.studentId, studentId),
            eq(Registration.id, applyId),
            isNull(Registration.deletedAt),
          ),
        )
        .for("share")
        .then(takeUnique);
      if (!registration) {
        await tx.rollback();
        throw new HttpException(
          "Registration student or applyId not found",
          HttpStatus.BAD_REQUEST,
        );
      }
      if (registration.professor) {
        const professorDetail = await tx
          .select({
            name: Professor.name,
            email: Professor.email,
            professorEnumId: ProfessorT.professorEnum,
          })
          .from(Professor)
          .leftJoin(
            ProfessorT,
            and(
              eq(Professor.id, ProfessorT.professorId),
              isNull(ProfessorT.deletedAt),
              lte(ProfessorT.startTerm, cur),
              or(isNull(ProfessorT.endTerm), gt(ProfessorT.endTerm, cur)),
            ),
          )
          .where(
            and(
              eq(Professor.id, registration.professor),
              isNull(Professor.deletedAt),
            ),
          )
          .for("share")
          .then(takeUnique);
        const registrationDetail = {
          ...registration,
          professor: professorDetail,
        };
        return registrationDetail;
      }
      return { ...registration, professor: undefined };
    });
    return result;
  }

  async getStudentRegistrationsClubRegistrationsMy(
    studentId: number,
  ): Promise<ApiReg012ResponseOk> {
    const result = await this.db
      .select({
        id: Registration.id,
        registrationTypeEnumId: Registration.registrationApplicationTypeEnumId,
        registrationStatusEnumId:
          Registration.registrationApplicationStatusEnumId,
        krName: Registration.clubNameKr,
        enName: Registration.clubNameEn,
      })
      .from(Registration)
      .where(
        and(
          eq(Registration.studentId, studentId),
          isNull(Registration.deletedAt),
        ),
      );
    return { registrations: result };
  }

  async getExecutiveRegistrationsClubRegistrations(
    pageOffset: number,
    itemCount: number,
  ): Promise<ApiReg014ResponseOk> {
    const numberOfClubRegistrations = (
      await this.db
        .select({ count: count(Registration.id) })
        .from(Registration)
        .then(takeUnique)
    ).count;

    const startOffset = (pageOffset - 1) * itemCount;
    const clubRegistrations = await this.db
      .select({
        id: Registration.id,
        registrationTypeEnumId: Registration.registrationApplicationTypeEnumId,
        registrationStatusEnumId:
          Registration.registrationApplicationStatusEnumId,
        divisionId: Registration.divisionId,
        clubNameKr: Registration.clubNameKr,
        clubNameEn: Registration.clubNameEn,
        representativeName: Student.name,
        activityFieldKr: Registration.activityFieldKr,
        activityFieldEn: Registration.activityFieldEn,
        professorName: Professor.name,
      })
      .from(Registration)
      .innerJoin(
        Student,
        and(eq(Registration.studentId, Student.id), isNull(Student.deletedAt)),
      )
      .leftJoin(
        Professor,
        and(
          eq(Registration.professorId, Professor.id),
          isNull(Professor.deletedAt),
        ),
      )
      .orderBy(desc(Registration.createdAt))
      .limit(itemCount)
      .offset(startOffset);

    return {
      items: clubRegistrations,
      total: numberOfClubRegistrations,
      offset: pageOffset,
    };
  }

  async getExecutiveRegistrationsClubRegistration(
    applyId: number,
  ): Promise<ApiReg015ResponseOk> {
    const result = await this.db.transaction(async tx => {
      const cur = getKSTDate();
      const professor = tx
        .select({
          id: Professor.id,
          name: Professor.name,
          email: Professor.email,
          professorEnumId: ProfessorT.professorEnum,
        })
        .from(Professor)
        .innerJoin(
          ProfessorT,
          and(
            eq(Professor.id, ProfessorT.professorId),
            lte(ProfessorT.startTerm, cur),
            or(gt(ProfessorT.endTerm, cur), isNull(ProfessorT.endTerm)),
            isNull(ProfessorT.deletedAt),
          ),
        )
        .where(isNull(Professor.deletedAt))
        .as("professor");

      const representative = tx
        .select({
          id: Student.id,
          name: Student.name,
          studentNumber: Student.number,
        })
        .from(Student)
        .innerJoin(
          StudentT,
          and(
            eq(Student.id, StudentT.studentId),
            lte(StudentT.startTerm, cur),
            or(gt(StudentT.endTerm, cur), isNull(StudentT.endTerm)),
            isNull(StudentT.deletedAt),
          ),
        )
        .where(isNull(Student.deletedAt))
        .as("representative");

      const File1 = alias(File, "File1");
      const File2 = alias(File, "File2");
      const File3 = alias(File, "File3");
      const registration = await tx
        .select({
          id: Registration.id,
          registrationTypeEnumId:
            Registration.registrationApplicationTypeEnumId,
          registrationStatusEnumId:
            Registration.registrationApplicationStatusEnumId,
          clubId: Registration.clubId,
          clubNameKr: Registration.clubNameKr,
          clubNameEn: Registration.clubNameEn,
          representative: {
            studentNumber: representative.studentNumber,
            name: representative.name,
          },
          phoneNumber: Registration.phoneNumber,
          foundedAt: Registration.foundedAt,
          divisionId: Registration.divisionId,
          activityFieldKr: Registration.activityFieldKr,
          activityFieldEn: Registration.activityFieldEn,
          professor: {
            name: professor.name,
            email: professor.email,
            professorEnumId: professor.professorEnumId,
          },
          divisionConsistency: Registration.divisionConsistency,
          foundationPurpose: Registration.foundationPurpose,
          activityPlan: Registration.activityPlan,
          activityPlanFileId: Registration.registrationActivityPlanFileId,
          activityPlanFileName: File1.name,
          clubRuleFileId: Registration.registrationClubRuleFileId,
          clubRuleFileName: File2.name,
          externalInstructionFileId:
            Registration.registrationExternalInstructionFileId,
          externalInstructionFileName: File3.name,
          isProfessorSigned: Registration.professorApprovedAt,
        })
        .from(Registration)
        .innerJoin(
          representative,
          eq(Registration.studentId, representative.id),
        ) // 대표자가 없는 학생이라면 잘못된 신청이라는 의미인것 같아서 innerjoin으로 연결시킴.
        .leftJoin(professor, eq(Registration.professorId, professor.id))
        .leftJoin(
          File1,
          and(
            eq(Registration.registrationActivityPlanFileId, File1.id),
            isNull(File1.deletedAt),
          ),
        )
        .leftJoin(
          File2,
          and(
            eq(Registration.registrationClubRuleFileId, File2.id),
            isNull(File2.deletedAt),
          ),
        )
        .leftJoin(
          File3,
          and(
            eq(Registration.registrationExternalInstructionFileId, File3.id),
            isNull(File3.deletedAt),
          ),
        )
        .where(
          and(eq(Registration.id, applyId), isNull(Registration.deletedAt)),
        )
        .for("share")
        .then(takeUnique);
      if (!registration) {
        await tx.rollback();
        throw new HttpException(
          "Registration not found",
          HttpStatus.BAD_REQUEST,
        );
      }
      const comments = await tx
        .select({
          content: RegistrationExecutiveComment.content,
          createdAt: RegistrationExecutiveComment.createdAt,
        })
        .from(RegistrationExecutiveComment)
        .where(
          and(
            eq(RegistrationExecutiveComment.registrationId, applyId),
            isNull(RegistrationExecutiveComment.deletedAt),
          ),
        );
      return {
        ...registration,
        isProfessorSigned: !!registration.isProfessorSigned,
        comments,
      };
    });
    return result;
  }

  async patchExecutiveRegistrationsClubRegistrationApproval(
    applyId: number,
  ): Promise<ApiReg016ResponseOk> {
    const response = await this.db.transaction(async tx => {
      const [result] = await tx
        .update(Registration)
        .set({
          registrationApplicationStatusEnumId: RegistrationStatusEnum.Approved,
          reviewedAt: sql`NOW()`,
        })
        .where(
          and(
            isNull(Registration.deletedAt),
            eq(Registration.id, applyId),
            or(
              eq(
                Registration.registrationApplicationStatusEnumId,
                RegistrationStatusEnum.Pending,
              ),
              eq(
                Registration.registrationApplicationStatusEnumId,
                RegistrationStatusEnum.Rejected,
              ),
            ),
          ),
        );
      if (result.affectedRows > 1) {
        await tx.rollback();
        throw new HttpException("Registration update failed", 500);
      } else if (result.affectedRows === 0) {
        await tx.rollback();
        throw new HttpException(
          "Registration not found",
          HttpStatus.BAD_REQUEST,
        );
        // applyID가 잘못되었거나 status가 pending이나 rejected가 아닌 경우인데 registration not found하나로 처리해도 되려나????
      }
      return {};
    });
    return response;
  }

  async postExecutiveRegistrationsClubRegistrationSendBack(
    applyId: number,
    executiveId: number,
    comment: string,
  ): Promise<ApiReg017ResponseCreated> {
    const response = await this.db.transaction(async tx => {
      const [result1] = await tx
        .update(Registration)
        .set({
          registrationApplicationStatusEnumId: RegistrationStatusEnum.Rejected,
          reviewedAt: sql`NOW()`,
        })
        .where(
          and(isNull(Registration.deletedAt), eq(Registration.id, applyId)),
        );
      if (result1.affectedRows > 1) {
        await tx.rollback();
        throw new HttpException("Registration update failed", 500);
      } else if (result1.affectedRows === 0) {
        await tx.rollback();
        throw new HttpException(
          "Registration not found",
          HttpStatus.BAD_REQUEST,
        );
      }
      const [result2] = await tx.insert(RegistrationExecutiveComment).values({
        registrationId: applyId,
        executiveId,
        content: comment,
      });
      if (result2.affectedRows !== 1) {
        await tx.rollback();
        throw new HttpException("Registration comment insert failed", 500);
      }
      return {};
    });
    return response;
  }
}
