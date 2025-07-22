import { HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";
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

import {
  ApiReg001RequestBody,
  ApiReg001ResponseCreated,
} from "@clubs/interface/api/registration/endpoint/apiReg001";
import {
  ApiReg009RequestBody,
  ApiReg009ResponseOk,
} from "@clubs/interface/api/registration/endpoint/apiReg009";
import { ApiReg010ResponseOk } from "@clubs/interface/api/registration/endpoint/apiReg010";
import { ApiReg011ResponseOk } from "@clubs/interface/api/registration/endpoint/apiReg011";
import { ApiReg012ResponseOk } from "@clubs/interface/api/registration/endpoint/apiReg012";
import { ApiReg014ResponseOk } from "@clubs/interface/api/registration/endpoint/apiReg014";
import { ApiReg015ResponseOk } from "@clubs/interface/api/registration/endpoint/apiReg015";
import { ApiReg016ResponseOk } from "@clubs/interface/api/registration/endpoint/apiReg016";
import { ApiReg017ResponseCreated } from "@clubs/interface/api/registration/endpoint/apiReg017";
import { ClubDelegateEnum } from "@clubs/interface/common/enum/club.enum";
import {
  RegistrationDeadlineEnum,
  RegistrationStatusEnum,
  RegistrationTypeEnum,
} from "@clubs/interface/common/enum/registration.enum";

import logger from "@sparcs-clubs/api/common/util/logger";
import { getKSTDate, takeOne } from "@sparcs-clubs/api/common/util/util";
import { DrizzleAsyncProvider } from "@sparcs-clubs/api/drizzle/drizzle.provider";
import {
  ClubDelegate,
  ClubOld,
} from "@sparcs-clubs/api/drizzle/schema/club.schema";
import { Division } from "@sparcs-clubs/api/drizzle/schema/division.schema";
import { File } from "@sparcs-clubs/api/drizzle/schema/file.schema";
import {
  Registration,
  RegistrationExecutiveComment,
} from "@sparcs-clubs/api/drizzle/schema/registration.schema";
import { RegistrationDeadlineD } from "@sparcs-clubs/api/drizzle/schema/semester.schema";
import {
  Professor,
  ProfessorT,
  Student,
  StudentT,
  User,
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
          lte(RegistrationDeadlineD.startTerm, date),
          gt(RegistrationDeadlineD.endTerm, date),
          inArray(RegistrationDeadlineD.deadlineEnum, enums),
          isNull(RegistrationDeadlineD.deletedAt),
        ),
      );
    return result;
  }

  async findByClubAndSemesterId(clubId: number, semesterId: number) {
    const registration = await this.db
      .select()
      .from(Registration)
      .where(
        and(
          eq(Registration.clubId, clubId),
          eq(Registration.semesterId, semesterId),
          isNull(Registration.deletedAt),
        ),
      );
    return registration;
  }

  async findByStudentAndSemesterId(studentId: number, semesterId: number) {
    const registration = await this.db
      .select()
      .from(Registration)
      .where(
        and(
          eq(Registration.studentId, studentId),
          eq(Registration.semesterId, semesterId),
          isNull(Registration.deletedAt),
        ),
      );

    return registration;
  }

  async createRegistration(
    studentId: number,
    semesterId: number,
    body: ApiReg001RequestBody,
  ): Promise<ApiReg001ResponseCreated> {
    const cur = getKSTDate();
    let registrationId: number;
    let clubId: number;
    await this.db.transaction(async tx => {
      // - 신규 가동아리 신청을 제외하곤 기존 동아리 대표자의 신청인지 검사합니다.
      // 한 학생이 여러 동아리의 대표자나 대의원일 수 없기 때문에, 1개 또는 0개의 지위를 가지고 있다고 가정합니다.
      if (body.registrationTypeEnumId !== RegistrationTypeEnum.NewProvisional) {
        const delegate = await tx
          .select({
            clubId: ClubDelegate.clubId,
            studentId: ClubDelegate.studentId,
          })
          .from(ClubDelegate)
          .where(
            and(
              eq(ClubDelegate.studentId, studentId),
              eq(ClubDelegate.clubId, body.clubId),
              lte(ClubDelegate.startTerm, cur),
              or(gte(ClubDelegate.endTerm, cur), isNull(ClubDelegate.endTerm)),
              isNull(ClubDelegate.deletedAt),
            ),
          )
          .for("share")
          .then(takeOne);
        if (!delegate) {
          throw new HttpException(
            "Student is not delegate of the club",
            HttpStatus.BAD_REQUEST,
          );
        }
      } else {
        // 신규 가동아리의 경우, club을 생성해줍니다.

        // 신규 가동아리의 경우, 해당 학생이 동아리 대표자 및 대의원이 아니어야 합니다.
        // TODO: Service layer로 이동 필요
        const delegate = await tx
          .select()
          .from(ClubDelegate)
          .where(
            and(
              eq(ClubDelegate.studentId, studentId),
              lte(ClubDelegate.startTerm, cur),
              or(gte(ClubDelegate.endTerm, cur), isNull(ClubDelegate.endTerm)),
              isNull(ClubDelegate.deletedAt),
            ),
          );
        if (delegate.length > 0) {
          throw new HttpException(
            "Student is delegate of the club",
            HttpStatus.BAD_REQUEST,
          );
        }

        // 동아리 및 대표자를 생성합니다.
        // TODO: Service layer로 이동 및 club & delegate public service 로 이동 필요
        const result = await tx.insert(ClubOld).values({
          nameKr: body.clubNameKr,
          nameEn: body.clubNameEn,
          divisionId: body.divisionId,
          foundingYear: body.foundedAt.getFullYear(),
          description: body.foundationPurpose,
        });
        clubId = result[0].insertId;
        if (!clubId) {
          throw new HttpException(
            "ClubOld creation failed",
            HttpStatus.BAD_REQUEST,
          );
        }

        const delegateResult = await tx.insert(ClubDelegate).values({
          studentId,
          startTerm: cur,
          clubId,
          clubDelegateEnum: ClubDelegateEnum.Representative,
        });
        if (!delegateResult[0].insertId) {
          throw new HttpException(
            "Delegate creation failed",
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      let professor;
      if (body.professor) {
        professor = await tx
          .insert(Professor)
          .values({
            email: body.professor.email,
            name: body.professor.name,
          })
          .onDuplicateKeyUpdate({
            set: { name: body.professor.name },
          });
        professor = await tx
          .select({
            id: Professor.id,
          })
          .from(Professor)
          .where(
            and(
              eq(Professor.email, body.professor.email),
              eq(Professor.name, body.professor.name),
              isNull(Professor.deletedAt),
            ),
          )
          .for("share")
          .then(takeOne);

        logger.debug(professor);

        await tx
          .insert(ProfessorT)
          .values({
            professorId: professor.id,
            professorEnum: body.professor.professorEnumId,
            startTerm: cur,
          })
          .onDuplicateKeyUpdate({
            set: { professorEnum: body.professor.professorEnumId },
          });
      }

      // registration insert 후 id 가져오기
      const [registrationInsertResult] = await tx.insert(Registration).values({
        clubId: body.clubId ?? clubId,
        registrationApplicationTypeEnumId: body.registrationTypeEnumId,
        semesterId,
        clubNameKr: body.clubNameKr,
        clubNameEn: body.clubNameEn,
        studentId,
        phoneNumber: body.phoneNumber,
        foundedAt: body.foundedAt,
        divisionId: body.divisionId,
        activityFieldKr: body.activityFieldKr,
        activityFieldEn: body.activityFieldEn,
        professorId: professor?.id ?? null,
        divisionConsistency: body.divisionConsistency,
        foundationPurpose: body.foundationPurpose,
        activityPlan: body.activityPlan,
        registrationActivityPlanFileId: body.activityPlanFileId,
        registrationClubRuleFileId: body.clubRuleFileId,
        registrationExternalInstructionFileId: body.externalInstructionFileId,
        registrationApplicationStatusEnumId: RegistrationStatusEnum.Pending,
      });

      registrationId = registrationInsertResult.insertId;

      logger.debug(
        `[createRegistration] Registration inserted with id ${registrationId}`,
      );
    });

    logger.debug("[createRegistration] insertion ends successfully");
    return { id: registrationId };
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
            body.clubId === undefined || body.clubId === null
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
        .then(takeOne);
      if (
        !registration ||
        registration.RegistrationStatusEnum === RegistrationStatusEnum.Approved
      ) {
        throw new HttpException(
          "No registration found",
          HttpStatus.BAD_REQUEST,
        );
      }

      let professor;
      if (body.professor) {
        professor = await tx
          .insert(Professor)
          .values({
            email: body.professor.email,
            name: body.professor.name,
          })
          .onDuplicateKeyUpdate({
            set: { name: body.professor.name },
          });
        professor = await tx
          .select({
            id: Professor.id,
          })
          .from(Professor)
          .where(
            and(
              eq(Professor.email, body.professor.email),
              eq(Professor.name, body.professor.name),
              isNull(Professor.deletedAt),
            ),
          )
          .for("share")
          .then(takeOne);

        logger.debug(professor);

        await tx
          .insert(ProfessorT)
          .values({
            professorId: professor.id,
            professorEnum: body.professor.professorEnumId,
            startTerm: cur,
          })
          .onDuplicateKeyUpdate({
            set: { professorEnum: body.professor.professorEnumId },
          });
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
          professorId: professor?.id ?? null,
          divisionConsistency: body.divisionConsistency,
          foundationPurpose: body.foundationPurpose,
          activityPlan: body.activityPlan,
          registrationActivityPlanFileId: body.activityPlanFileId,
          registrationClubRuleFileId: body.clubRuleFileId,
          registrationExternalInstructionFileId: body.externalInstructionFileId,
          registrationApplicationStatusEnumId: RegistrationStatusEnum.Pending,
        })
        .where(
          and(
            eq(Registration.id, applyId),
            eq(Registration.studentId, studentId),
            isNull(Registration.deletedAt),
          ),
        );
      if (result.affectedRows > 1) {
        throw new HttpException("Registration update failed", 500);
      } else if (result.affectedRows === 0) {
        throw new HttpException("Registration Not Found", HttpStatus.NOT_FOUND);
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
      const [registration] = await tx
        .select()
        .from(Registration)
        .where(
          and(eq(Registration.id, applyId), isNull(Registration.deletedAt)),
        );
      if (!registration) {
        throw new HttpException("Registration Not Found", HttpStatus.NOT_FOUND);
      }

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
      // 만약 신규 가등록의 경우, 동아리 및 동아리 대표자 기록을 삭제합니다.
      // TODO: Service layer로 이동 및 club & delegate public service 로 이동 필요
      if (
        registration.registrationApplicationTypeEnumId ===
        RegistrationTypeEnum.NewProvisional
      ) {
        const [clubResult, delegateResult] = await Promise.all([
          tx
            .update(ClubOld)
            .set({ deletedAt: cur })
            .where(eq(ClubOld.id, registration.clubId)),
          tx
            .update(ClubDelegate)
            .set({ deletedAt: cur })
            .where(eq(ClubDelegate.clubId, registration.clubId)),
        ]);
        if (
          clubResult[0].affectedRows === 0 ||
          delegateResult[0].affectedRows === 0
        ) {
          throw new HttpException("ClubOld or delegate delete failed", 500);
        }
      }
      if (result.affectedRows > 1) {
        throw new HttpException("Registration delete failed", 500);
      } else if (result.affectedRows === 0) {
        throw new HttpException("Registration Not Found", HttpStatus.NOT_FOUND);
      }
    });
    return {};
  }

  async getStudentRegistrationsClubRegistration(
    studentId: number,
    applyId: number,
  ): Promise<ApiReg011ResponseOk> {
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
            // lte(StudentT.startTerm, cur),
            // or(gte(StudentT.endTerm, cur), isNull(StudentT.endTerm)),
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
          clubNameKr: ClubOld.nameKr,
          clubNameEn: ClubOld.nameEn,
          newClubNameKr: Registration.clubNameKr,
          newClubNameEn: Registration.clubNameEn,
          representative: {
            studentNumber: representative.studentNumber,
            name: representative.name,
            phoneNumber: Registration.phoneNumber,
          },
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
          updatedAt: Registration.updatedAt,
        })
        .from(Registration)
        .innerJoin(
          representative,
          eq(Registration.studentId, representative.id),
        ) // 대표자가 없는 학생이라면 잘못된 신청이라는 의미인것 같아서 innerjoin으로 연결시킴.
        .leftJoin(
          ClubOld,
          and(eq(Registration.clubId, ClubOld.id), isNull(ClubOld.deletedAt)),
        )
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
        .leftJoin(
          Division,
          and(
            eq(Registration.divisionId, Division.id),
            isNull(Division.deletedAt),
          ),
        )
        .where(
          and(eq(Registration.id, applyId), isNull(Registration.deletedAt)),
        )
        .for("share")
        .then(takeOne);
      if (!registration) {
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
        ...(registration.activityPlanFileId && {
          activityPlanFile: {
            id: registration.activityPlanFileId,
            name: registration.activityPlanFileName,
            url: null,
          },
        }),
        ...(registration.clubRuleFileId && {
          clubRuleFile: {
            id: registration.clubRuleFileId,
            name: registration.clubRuleFileName,
            url: null,
          },
        }),
        ...(registration.externalInstructionFileId && {
          externalInstructionFile: {
            id: registration.externalInstructionFileId,
            name: registration.externalInstructionFileName,
            url: null,
          },
        }),
      };
    });
    return result;
  }

  async getStudentRegistrationsClubRegistrationsMy(
    studentId: number,
    semesterId: number,
  ): Promise<ApiReg012ResponseOk> {
    const result = await this.db
      .select({
        id: Registration.id,
        registrationTypeEnum: Registration.registrationApplicationTypeEnumId,
        divisionName: Division.name,
        clubNameKr: ClubOld.nameKr,
        clubNameEn: ClubOld.nameEn,
        newClubNameKr: Registration.clubNameKr,
        newClubNameEn: Registration.clubNameEn,
        clubId: Registration.clubId,
        semesterId: Registration.semesterId,
        activityFieldKr: Registration.activityFieldKr,
        activityFieldEn: Registration.activityFieldEn,
        professorName: Professor.name,
        registrationStatusEnum:
          Registration.registrationApplicationStatusEnumId,
      })
      .from(Registration)
      .leftJoin(
        ClubOld,
        and(eq(Registration.clubId, ClubOld.id), isNull(ClubOld.deletedAt)),
      )
      .leftJoin(
        Division,
        and(
          eq(Registration.divisionId, Division.id),
          isNull(Division.deletedAt),
        ),
      )
      .leftJoin(
        Professor,
        and(
          eq(Registration.professorId, Professor.id),
          isNull(Professor.deletedAt),
        ),
      )
      .where(
        and(
          eq(Registration.studentId, studentId),
          eq(Registration.semesterId, semesterId),
          isNull(Registration.deletedAt),
        ),
      );
    return { registrations: result };
  }

  async getRegistrationsClubRegistrations(
    pageOffset: number,
    itemCount: number,
  ): Promise<ApiReg014ResponseOk> {
    const numberOfClubRegistrations = (
      await this.db
        .select({ count: count(Registration.id) })
        .from(Registration)
        .where(isNull(Registration.deletedAt))
        .then(takeOne)
    ).count;

    const startOffset = (pageOffset - 1) * itemCount;
    const clubRegistrations = await this.db
      .select({
        id: Registration.id,
        registrationTypeEnumId: Registration.registrationApplicationTypeEnumId,
        registrationStatusEnumId:
          Registration.registrationApplicationStatusEnumId,
        divisionId: Registration.divisionId,
        clubNameKr: ClubOld.nameKr,
        clubNameEn: ClubOld.nameEn,
        newClubNameKr: Registration.clubNameKr,
        newClubNameEn: Registration.clubNameEn,
        representativeName: Student.name,
        activityFieldKr: Registration.activityFieldKr,
        activityFieldEn: Registration.activityFieldEn,
        professorName: Professor.name,
      })
      .from(Registration)
      .leftJoin(
        ClubOld,
        and(eq(Registration.clubId, ClubOld.id), isNull(ClubOld.deletedAt)),
      )
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
      .where(isNull(Registration.deletedAt))
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
            // lte(StudentT.startTerm, cur),
            // or(gt(StudentT.endTerm, cur), isNull(StudentT.endTerm)),
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
          clubNameKr: ClubOld.nameKr,
          clubNameEn: ClubOld.nameEn,
          newClubNameKr: Registration.clubNameKr,
          newClubNameEn: Registration.clubNameEn,
          representative: {
            studentNumber: representative.studentNumber,
            name: representative.name,
            phoneNumber: Registration.phoneNumber,
          },
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
          updatedAt: Registration.updatedAt,
        })
        .from(Registration)
        .innerJoin(
          representative,
          eq(Registration.studentId, representative.id),
        ) // 대표자가 없는 학생이라면 잘못된 신청이라는 의미인것 같아서 innerjoin으로 연결시킴.
        .leftJoin(
          ClubOld,
          and(eq(Registration.clubId, ClubOld.id), isNull(ClubOld.deletedAt)),
        )
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
        .leftJoin(
          Division,
          and(
            eq(Registration.divisionId, Division.id),
            isNull(Division.deletedAt),
          ),
        )
        .where(
          and(eq(Registration.id, applyId), isNull(Registration.deletedAt)),
        )
        .for("share")
        .then(takeOne);
      if (!registration) {
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
        ...(registration.activityPlanFileId && {
          activityPlanFile: {
            id: registration.activityPlanFileId,
            name: registration.activityPlanFileName,
            url: null,
          },
        }),
        ...(registration.clubRuleFileId && {
          clubRuleFile: {
            id: registration.clubRuleFileId,
            name: registration.clubRuleFileName,
            url: null,
          },
        }),
        ...(registration.externalInstructionFileId && {
          externalInstructionFile: {
            id: registration.externalInstructionFileId,
            name: registration.externalInstructionFileName,
            url: null,
          },
        }),
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
        throw new HttpException("Registration update failed", 500);
      } else if (result.affectedRows === 0) {
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
        throw new HttpException("Registration update failed", 500);
      } else if (result1.affectedRows === 0) {
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
      }
      return {};
    });
    return response;
  }

  async selectRegistrationsAndRepresentativeByProfessorId(param: {
    professorId: number;
  }) {
    const result = await this.db
      .select()
      .from(Registration)
      .where(
        and(
          eq(Registration.professorId, param.professorId),
          isNull(Registration.deletedAt),
        ),
      )
      .leftJoin(
        ClubOld,
        and(eq(Registration.clubId, ClubOld.id), isNull(ClubOld.deletedAt)),
      )
      .innerJoin(Student, eq(Registration.studentId, Student.id))
      .leftJoin(User, eq(User.id, Student.userId))
      .innerJoin(
        Division,
        and(
          eq(Registration.divisionId, Division.id),
          isNull(Division.deletedAt),
        ),
      );

    return result;
  }

  /**
   * @param registrationId 동아리 등록 신청 ID
   * @return 등록 신청 ID가 일치하는 등록 신청들을 배열로 리턴합니다.
   * @description 위 등록 신청 ID 기반으로 조회하기에, 배열의 길이는 1 또는 0이여야 합니다.
   * 이 함수는 이를 검사하지 않습니다.
   */
  async selectRegistrationsById(param: { registrationId: number }) {
    const result = await this.db
      .select()
      .from(Registration)
      .where(
        and(
          eq(Registration.id, param.registrationId),
          isNull(Registration.deletedAt),
        ),
      );
    return result;
  }

  /**
   * @param registrationId 동아리 등록 신청 ID
   * @param approvedAt 갱신할 시간
   * @description 해당 등록 신청의 교수 서명 시간을 갱신합니다. 신청 ID가 유효한지 검사하지 않습니다.
   * @return 갱신 성공 여부를 boolean으로 리턴합니다. 참을 리턴하거나 예외가 발생합니다.
   */
  async updateRegistrationProfessorApprovedAt(param: {
    registrationId: number;
    approvedAt: Date;
  }): Promise<boolean> {
    const isUpdateSucceed = await this.db.transaction(async tx => {
      const [updateResult] = await tx
        .update(Registration)
        .set({ professorApprovedAt: param.approvedAt })
        .where(
          and(
            eq(Registration.id, param.registrationId),
            isNull(Registration.deletedAt),
          ),
        );
      if (updateResult.affectedRows !== 1)
        throw new HttpException(
          "update failed",
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      return true;
    });
    return isUpdateSucceed;
  }

  async getProfessorRegistrationsClubRegistration(param: {
    registrationId: number;
    professorId: number;
  }) {
    const results = await this.db
      .select()
      .from(Registration)
      .innerJoin(
        Student,
        and(eq(Registration.studentId, Student.id), isNull(Student.deletedAt)),
      )
      .innerJoin(
        ClubOld,
        and(eq(Registration.clubId, ClubOld.id), isNull(ClubOld.deletedAt)),
      )
      .innerJoin(
        Professor,
        and(
          eq(Registration.professorId, Professor.id),
          isNull(Professor.deletedAt),
        ),
      )
      .innerJoin(
        ProfessorT,
        and(
          eq(Professor.id, ProfessorT.professorId),
          isNull(ProfessorT.deletedAt),
        ),
      )
      .where(
        and(
          eq(Registration.id, param.registrationId),
          eq(Registration.professorId, param.professorId),
          isNull(Registration.deletedAt),
        ),
      );
    logger.debug(results);
    if (results.length === 0)
      throw new HttpException(
        "not a valid applyId or ProfessorId",
        HttpStatus.NOT_FOUND,
      );
    const result = results[0];

    const comments = await this.db
      .select()
      .from(RegistrationExecutiveComment)
      .where(
        and(
          eq(
            RegistrationExecutiveComment.registrationId,
            result.registration.id,
          ),
          isNull(RegistrationExecutiveComment.deletedAt),
        ),
      );

    return { ...result, comments };
  }

  async resetClubRegistrationStatusEnum(clubId: number) {
    await this.db.transaction(async tx => {
      await tx
        .update(Registration)
        .set({
          registrationApplicationStatusEnumId: RegistrationStatusEnum.Pending,
          professorApprovedAt: null,
        })
        .where(
          and(eq(Registration.clubId, clubId), isNull(Registration.deletedAt)),
        );
    });
  }

  async selectClubRegistrationDeadline(param: { semesterId: number }) {
    const result = await this.db
      .select()
      .from(RegistrationDeadlineD)
      .where(
        and(
          eq(RegistrationDeadlineD.semesterId, param.semesterId),
          eq(
            RegistrationDeadlineD.deadlineEnum,
            RegistrationDeadlineEnum.ClubRegistrationApplication,
          ),
          isNull(RegistrationDeadlineD.deletedAt),
        ),
      );
    return result;
  }
}
