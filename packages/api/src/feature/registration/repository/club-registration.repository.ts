import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { Prisma, PrismaClient } from "@prisma/client";

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
import { takeOne } from "@sparcs-clubs/api/common/util/util";
import { PrismaService } from "@sparcs-clubs/api/prisma/prisma.service";

@Injectable()
export class ClubRegistrationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async selectDeadlineByDate(
    date: Date,
    enums: Array<RegistrationDeadlineEnum>,
  ) {
    const result = await this.prisma.registrationDeadlineD.findMany({
      where: {
        startTerm: { lte: date },
        endTerm: { gt: date },
        deadlineEnum: { in: enums },
        deletedAt: null,
      },
    });
    return result;
  }

  async findByClubAndSemesterId(clubId: number, semesterId: number) {
    const registration = await this.prisma.registration.findMany({
      where: {
        clubId,
        semesterId,
        deletedAt: null,
      },
    });
    return registration;
  }

  async findByStudentAndSemesterId(studentId: number, semesterId: number) {
    const registration = await this.prisma.registration.findMany({
      where: {
        studentId,
        semesterId,
        deletedAt: null,
      },
    });

    return registration;
  }

  async createRegistration(
    studentId: number,
    semesterId: number,
    body: ApiReg001RequestBody,
  ): Promise<ApiReg001ResponseCreated> {
    const cur = new Date();
    let registrationId: number;
    let clubId: number;
    await this.prisma.$transaction(async tx => {
      // - 신규 가동아리 신청을 제외하곤 기존 동아리 대표자의 신청인지 검사합니다.
      // 한 학생이 여러 동아리의 대표자나 대의원일 수 없기 때문에, 1개 또는 0개의 지위를 가지고 있다고 가정합니다.
      if (body.registrationTypeEnumId !== RegistrationTypeEnum.NewProvisional) {
        const delegate = await (tx as unknown as PrismaClient).$queryRaw<
          Array<{ clubId: number; studentId: number }>
        >(Prisma.sql`
          SELECT cd.club_id AS clubId, cd.student_id AS studentId
          FROM club_delegate_d cd
          WHERE cd.student_id = ${studentId}
            AND cd.club_id = ${body.clubId}
            AND cd.start_term <= ${cur}
            AND (cd.end_term >= ${cur} OR cd.end_term IS NULL)
            AND cd.deleted_at IS NULL
          FOR SHARE
        `);
        if (!takeOne(delegate)) {
          throw new HttpException(
            "Student is not delegate of the club",
            HttpStatus.BAD_REQUEST,
          );
        }
      } else {
        // 신규 가동아리의 경우, club을 생성해줍니다.

        // 신규 가동아리의 경우, 해당 학생이 동아리 대표자 및 대의원이 아니어야 합니다.
        // TODO: Service layer로 이동 필요
        const delegate = await tx.clubDelegateD.findMany({
          where: {
            studentId,
            startTerm: { lte: cur },
            OR: [{ endTerm: { gte: cur } }, { endTerm: null }],
            deletedAt: null,
          },
        });
        if (delegate.length > 0) {
          throw new HttpException(
            "Student is delegate of the club",
            HttpStatus.BAD_REQUEST,
          );
        }

        // 동아리 및 대표자를 생성합니다.
        // TODO: Service layer로 이동 및 club & delegate public service 로 이동 필요
        // Note: The club table has a division_id column used by ClubOld in Drizzle,
        // but the Prisma Club model doesn't include it. Using raw SQL for insertion.
        await tx.$queryRaw(
          Prisma.sql`
            INSERT INTO club (name_kr, name_en, division_id, founding_year, description)
            VALUES (${body.clubNameKr}, ${body.clubNameEn}, ${body.divisionId}, ${body.foundedAt.getFullYear()}, ${body.foundationPurpose})
          `,
        );
        // For INSERT via $queryRaw, we need to fetch the last insert ID
        const lastInsertResult = await (
          tx as unknown as PrismaClient
        ).$queryRaw<Array<{ id: number }>>(
          Prisma.sql`SELECT LAST_INSERT_ID() AS id`,
        );
        clubId = lastInsertResult[0].id;
        if (!clubId) {
          throw new HttpException(
            "ClubOld creation failed",
            HttpStatus.BAD_REQUEST,
          );
        }

        const delegateResult = await tx.clubDelegateD.create({
          data: {
            studentId,
            startTerm: cur,
            clubId,
            clubDelegateEnum: ClubDelegateEnum.Representative,
          },
        });
        if (!delegateResult.id) {
          throw new HttpException(
            "Delegate creation failed",
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      let professor: { id: number } | null = null;
      if (body.professor) {
        await tx.$executeRaw(Prisma.sql`
          INSERT INTO professor (email, name)
          VALUES (${body.professor.email}, ${body.professor.name})
          ON DUPLICATE KEY UPDATE name = ${body.professor.name}
        `);
        const professorRows = await (tx as unknown as PrismaClient).$queryRaw<
          Array<{ id: number }>
        >(
          Prisma.sql`
            SELECT p.id
            FROM professor p
            WHERE p.email = ${body.professor.email}
              AND p.name = ${body.professor.name}
              AND p.deleted_at IS NULL
            FOR SHARE
          `,
        );
        professor = takeOne(professorRows);

        logger.debug(professor);

        await tx.$executeRaw(Prisma.sql`
          INSERT INTO professor_t (professor_id, professor_enum, start_term)
          VALUES (${professor.id}, ${body.professor.professorEnumId}, ${cur})
          ON DUPLICATE KEY UPDATE professor_enum = ${body.professor.professorEnumId}
        `);
      }

      // registration insert 후 id 가져오기
      const registrationInsertResult = await tx.registration.create({
        data: {
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
        },
      });

      registrationId = registrationInsertResult.id;

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
    const cur = new Date();
    await this.prisma.$transaction(async tx => {
      const registrationRows = await (tx as unknown as PrismaClient).$queryRaw<
        Array<{ RegistrationStatusEnum: number }>
      >(Prisma.sql`
        SELECT r.registration_application_status_enum_id AS RegistrationStatusEnum
        FROM registration r
        WHERE r.id = ${applyId}
          ${body.clubId !== undefined && body.clubId !== null ? Prisma.sql`AND r.club_id = ${body.clubId}` : Prisma.empty}
          AND r.registration_application_type_enum_id = ${body.registrationTypeEnumId}
          AND r.student_id = ${studentId}
          AND r.deleted_at IS NULL
        FOR UPDATE
      `);
      const registration = takeOne(registrationRows);
      if (
        !registration ||
        registration.RegistrationStatusEnum === RegistrationStatusEnum.Approved
      ) {
        throw new HttpException(
          "No registration found",
          HttpStatus.BAD_REQUEST,
        );
      }

      let professor: { id: number } | null = null;
      if (body.professor) {
        await tx.$executeRaw(Prisma.sql`
          INSERT INTO professor (email, name)
          VALUES (${body.professor.email}, ${body.professor.name})
          ON DUPLICATE KEY UPDATE name = ${body.professor.name}
        `);
        const professorRows = await (tx as unknown as PrismaClient).$queryRaw<
          Array<{ id: number }>
        >(
          Prisma.sql`
            SELECT p.id
            FROM professor p
            WHERE p.email = ${body.professor.email}
              AND p.name = ${body.professor.name}
              AND p.deleted_at IS NULL
            FOR SHARE
          `,
        );
        professor = takeOne(professorRows);

        logger.debug(professor);

        await tx.$executeRaw(Prisma.sql`
          INSERT INTO professor_t (professor_id, professor_enum, start_term)
          VALUES (${professor.id}, ${body.professor.professorEnumId}, ${cur})
          ON DUPLICATE KEY UPDATE professor_enum = ${body.professor.professorEnumId}
        `);
      }

      const result = await tx.registration.updateMany({
        where: {
          id: applyId,
          studentId,
          deletedAt: null,
        },
        data: {
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
        },
      });
      if (result.count > 1) {
        throw new HttpException("Registration update failed", 500);
      } else if (result.count === 0) {
        throw new HttpException("Registration Not Found", HttpStatus.NOT_FOUND);
      }
    });
    return {};
  }

  async deleteStudentRegistrationsClubRegistration(
    studentId: number,
    applyId: number,
  ): Promise<ApiReg010ResponseOk> {
    const cur = new Date();
    await this.prisma.$transaction(async tx => {
      const registration = await tx.registration
        .findMany({
          where: {
            id: applyId,
            deletedAt: null,
          },
        })
        .then(takeOne);
      if (!registration) {
        throw new HttpException("Registration Not Found", HttpStatus.NOT_FOUND);
      }

      const result = await tx.registration.updateMany({
        where: {
          id: applyId,
          studentId,
          deletedAt: null,
        },
        data: {
          deletedAt: cur,
        },
      });
      // 만약 신규 가등록의 경우, 동아리 및 동아리 대표자 기록을 삭제합니다.
      // TODO: Service layer로 이동 및 club & delegate public service 로 이동 필요
      if (
        registration.registrationApplicationTypeEnumId ===
        RegistrationTypeEnum.NewProvisional
      ) {
        const [clubResult, delegateResult] = await Promise.all([
          tx.club.updateMany({
            where: { id: registration.clubId },
            data: { deletedAt: cur },
          }),
          tx.clubDelegateD.updateMany({
            where: { clubId: registration.clubId },
            data: { deletedAt: cur },
          }),
        ]);
        if (clubResult.count === 0 || delegateResult.count === 0) {
          throw new HttpException("ClubOld or delegate delete failed", 500);
        }
      }
      if (result.count > 1) {
        throw new HttpException("Registration delete failed", 500);
      } else if (result.count === 0) {
        throw new HttpException("Registration Not Found", HttpStatus.NOT_FOUND);
      }
    });
    return {};
  }

  async getStudentRegistrationsClubRegistration(
    studentId: number,
    applyId: number,
  ): Promise<ApiReg011ResponseOk> {
    const result = await this.prisma.$transaction<ApiReg011ResponseOk>(
      async tx => {
        const cur = new Date();
        const rows = await (tx as unknown as PrismaClient).$queryRaw<
          Array<{
            id: number;
            registrationTypeEnumId: number;
            registrationStatusEnumId: number;
            clubId: number | null;
            clubNameKr: string | null;
            clubNameEn: string | null;
            newClubNameKr: string | null;
            newClubNameEn: string | null;
            studentNumber: number;
            representativeName: string;
            phoneNumber: string | null;
            foundedAt: Date;
            divisionId: number;
            activityFieldKr: string | null;
            activityFieldEn: string | null;
            professorName: string | null;
            professorEmail: string | null;
            professorEnumId: number | null;
            divisionConsistency: string | null;
            foundationPurpose: string | null;
            activityPlan: string | null;
            activityPlanFileId: string | null;
            activityPlanFileName: string | null;
            clubRuleFileId: string | null;
            clubRuleFileName: string | null;
            externalInstructionFileId: string | null;
            externalInstructionFileName: string | null;
            isProfessorSigned: Date | null;
            updatedAt: Date | null;
          }>
        >(Prisma.sql`
        SELECT
          r.id,
          r.registration_application_type_enum_id AS registrationTypeEnumId,
          r.registration_application_status_enum_id AS registrationStatusEnumId,
          r.club_id AS clubId,
          c.name_kr AS clubNameKr,
          c.name_en AS clubNameEn,
          r.club_name_kr AS newClubNameKr,
          r.club_name_en AS newClubNameEn,
          rep.number AS studentNumber,
          rep.name AS representativeName,
          r.phone_number AS phoneNumber,
          r.founded_at AS foundedAt,
          r.division_id AS divisionId,
          r.activity_field_kr AS activityFieldKr,
          r.activity_field_en AS activityFieldEn,
          prof.name AS professorName,
          prof.email AS professorEmail,
          pt.professor_enum AS professorEnumId,
          r.division_consistency AS divisionConsistency,
          r.foundation_purpose AS foundationPurpose,
          r.activity_plan AS activityPlan,
          r.registration_activity_plan_file_id AS activityPlanFileId,
          f1.name AS activityPlanFileName,
          r.registration_club_rule_file_id AS clubRuleFileId,
          f2.name AS clubRuleFileName,
          r.registration_external_instruction_file_id AS externalInstructionFileId,
          f3.name AS externalInstructionFileName,
          r.professor_approved_at AS isProfessorSigned,
          r.updated_at AS updatedAt
        FROM registration r
        INNER JOIN (
          SELECT s.id, s.name, s.number
          FROM student s
          INNER JOIN student_t st ON s.id = st.student_id AND st.deleted_at IS NULL
          WHERE s.deleted_at IS NULL
        ) rep ON r.student_id = rep.id
        LEFT JOIN club c ON r.club_id = c.id AND c.deleted_at IS NULL
        LEFT JOIN (
          SELECT p.id, p.name, p.email, pt2.professor_enum
          FROM professor p
          INNER JOIN professor_t pt2 ON p.id = pt2.professor_id
            AND pt2.start_term <= ${cur}
            AND (pt2.end_term > ${cur} OR pt2.end_term IS NULL)
            AND pt2.deleted_at IS NULL
          WHERE p.deleted_at IS NULL
        ) prof ON r.professor_id = prof.id
        LEFT JOIN professor_t pt ON prof.id = pt.professor_id
          AND pt.start_term <= ${cur}
          AND (pt.end_term > ${cur} OR pt.end_term IS NULL)
          AND pt.deleted_at IS NULL
        LEFT JOIN file f1 ON r.registration_activity_plan_file_id = f1.id AND f1.deleted_at IS NULL
        LEFT JOIN file f2 ON r.registration_club_rule_file_id = f2.id AND f2.deleted_at IS NULL
        LEFT JOIN file f3 ON r.registration_external_instruction_file_id = f3.id AND f3.deleted_at IS NULL
        LEFT JOIN division d ON r.division_id = d.id AND d.deleted_at IS NULL
        WHERE r.id = ${applyId} AND r.deleted_at IS NULL
        FOR SHARE
      `);
        const registration = takeOne(rows);
        if (!registration) {
          throw new HttpException(
            "Registration not found",
            HttpStatus.BAD_REQUEST,
          );
        }
        const comments = await tx.registrationExecutiveComment.findMany({
          where: {
            registrationId: applyId,
            deletedAt: null,
          },
          select: {
            content: true,
            createdAt: true,
          },
        });
        return {
          id: registration.id,
          registrationTypeEnumId: registration.registrationTypeEnumId,
          registrationStatusEnumId: registration.registrationStatusEnumId,
          clubId: registration.clubId,
          clubNameKr: registration.clubNameKr,
          clubNameEn: registration.clubNameEn,
          newClubNameKr: registration.newClubNameKr,
          newClubNameEn: registration.newClubNameEn,
          representative: {
            studentNumber: registration.studentNumber,
            name: registration.representativeName,
            phoneNumber: registration.phoneNumber,
          },
          foundedAt: registration.foundedAt,
          divisionId: registration.divisionId,
          activityFieldKr: registration.activityFieldKr,
          activityFieldEn: registration.activityFieldEn,
          professor: {
            name: registration.professorName,
            email: registration.professorEmail,
            professorEnumId: registration.professorEnumId,
          },
          divisionConsistency: registration.divisionConsistency,
          foundationPurpose: registration.foundationPurpose,
          activityPlan: registration.activityPlan,
          activityPlanFileId: registration.activityPlanFileId,
          clubRuleFileId: registration.clubRuleFileId,
          externalInstructionFileId: registration.externalInstructionFileId,
          isProfessorSigned: !!registration.isProfessorSigned,
          updatedAt: registration.updatedAt,
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
      },
    );
    return result;
  }

  async getStudentRegistrationsClubRegistrationsMy(
    studentId: number,
    semesterId: number,
  ): Promise<ApiReg012ResponseOk> {
    const result = await this.prisma.$queryRaw<
      Array<{
        id: number;
        registrationTypeEnum: number;
        divisionName: string | null;
        clubNameKr: string | null;
        clubNameEn: string | null;
        newClubNameKr: string | null;
        newClubNameEn: string | null;
        clubId: number | null;
        semesterId: number | null;
        activityFieldKr: string | null;
        activityFieldEn: string | null;
        professorName: string | null;
        registrationStatusEnum: number;
      }>
    >(Prisma.sql`
      SELECT
        r.id,
        r.registration_application_type_enum_id AS registrationTypeEnum,
        d.name AS divisionName,
        c.name_kr AS clubNameKr,
        c.name_en AS clubNameEn,
        r.club_name_kr AS newClubNameKr,
        r.club_name_en AS newClubNameEn,
        r.club_id AS clubId,
        r.semester_d_id AS semesterId,
        r.activity_field_kr AS activityFieldKr,
        r.activity_field_en AS activityFieldEn,
        p.name AS professorName,
        r.registration_application_status_enum_id AS registrationStatusEnum
      FROM registration r
      LEFT JOIN club c ON r.club_id = c.id AND c.deleted_at IS NULL
      LEFT JOIN division d ON r.division_id = d.id AND d.deleted_at IS NULL
      LEFT JOIN professor p ON r.professor_id = p.id AND p.deleted_at IS NULL
      WHERE r.student_id = ${studentId}
        AND r.semester_d_id = ${semesterId}
        AND r.deleted_at IS NULL
    `);
    return { registrations: result };
  }

  async getRegistrationsClubRegistrations(
    pageOffset: number,
    itemCount: number,
  ): Promise<ApiReg014ResponseOk> {
    const numberOfClubRegistrations = await this.prisma.registration.count({
      where: { deletedAt: null },
    });

    const startOffset = (pageOffset - 1) * itemCount;
    const clubRegistrations = await this.prisma.$queryRaw<
      Array<{
        id: number;
        registrationTypeEnumId: number;
        registrationStatusEnumId: number;
        divisionId: number;
        clubNameKr: string | null;
        clubNameEn: string | null;
        newClubNameKr: string | null;
        newClubNameEn: string | null;
        representativeName: string;
        activityFieldKr: string | null;
        activityFieldEn: string | null;
        professorName: string | null;
      }>
    >(Prisma.sql`
      SELECT
        r.id,
        r.registration_application_type_enum_id AS registrationTypeEnumId,
        r.registration_application_status_enum_id AS registrationStatusEnumId,
        r.division_id AS divisionId,
        c.name_kr AS clubNameKr,
        c.name_en AS clubNameEn,
        r.club_name_kr AS newClubNameKr,
        r.club_name_en AS newClubNameEn,
        s.name AS representativeName,
        r.activity_field_kr AS activityFieldKr,
        r.activity_field_en AS activityFieldEn,
        p.name AS professorName
      FROM registration r
      LEFT JOIN club c ON r.club_id = c.id AND c.deleted_at IS NULL
      INNER JOIN student s ON r.student_id = s.id AND s.deleted_at IS NULL
      LEFT JOIN professor p ON r.professor_id = p.id AND p.deleted_at IS NULL
      WHERE r.deleted_at IS NULL
      ORDER BY r.created_at DESC
      LIMIT ${itemCount}
      OFFSET ${startOffset}
    `);

    return {
      items: clubRegistrations,
      total: numberOfClubRegistrations,
      offset: pageOffset,
    };
  }

  async getExecutiveRegistrationsClubRegistration(
    applyId: number,
  ): Promise<ApiReg015ResponseOk> {
    const result = await this.prisma.$transaction<ApiReg015ResponseOk>(
      async tx => {
        const cur = new Date();
        const rows = await (tx as unknown as PrismaClient).$queryRaw<
          Array<{
            id: number;
            registrationTypeEnumId: number;
            registrationStatusEnumId: number;
            clubId: number | null;
            clubNameKr: string | null;
            clubNameEn: string | null;
            newClubNameKr: string | null;
            newClubNameEn: string | null;
            studentNumber: number;
            representativeName: string;
            phoneNumber: string | null;
            foundedAt: Date;
            divisionId: number;
            activityFieldKr: string | null;
            activityFieldEn: string | null;
            professorName: string | null;
            professorEmail: string | null;
            professorEnumId: number | null;
            divisionConsistency: string | null;
            foundationPurpose: string | null;
            activityPlan: string | null;
            activityPlanFileId: string | null;
            activityPlanFileName: string | null;
            clubRuleFileId: string | null;
            clubRuleFileName: string | null;
            externalInstructionFileId: string | null;
            externalInstructionFileName: string | null;
            isProfessorSigned: Date | null;
            updatedAt: Date | null;
          }>
        >(Prisma.sql`
        SELECT
          r.id,
          r.registration_application_type_enum_id AS registrationTypeEnumId,
          r.registration_application_status_enum_id AS registrationStatusEnumId,
          r.club_id AS clubId,
          c.name_kr AS clubNameKr,
          c.name_en AS clubNameEn,
          r.club_name_kr AS newClubNameKr,
          r.club_name_en AS newClubNameEn,
          rep.number AS studentNumber,
          rep.name AS representativeName,
          r.phone_number AS phoneNumber,
          r.founded_at AS foundedAt,
          r.division_id AS divisionId,
          r.activity_field_kr AS activityFieldKr,
          r.activity_field_en AS activityFieldEn,
          prof.name AS professorName,
          prof.email AS professorEmail,
          prof.professorEnumId,
          r.division_consistency AS divisionConsistency,
          r.foundation_purpose AS foundationPurpose,
          r.activity_plan AS activityPlan,
          r.registration_activity_plan_file_id AS activityPlanFileId,
          f1.name AS activityPlanFileName,
          r.registration_club_rule_file_id AS clubRuleFileId,
          f2.name AS clubRuleFileName,
          r.registration_external_instruction_file_id AS externalInstructionFileId,
          f3.name AS externalInstructionFileName,
          r.professor_approved_at AS isProfessorSigned,
          r.updated_at AS updatedAt
        FROM registration r
        INNER JOIN (
          SELECT s.id, s.name, s.number
          FROM student s
          INNER JOIN student_t st ON s.id = st.student_id AND st.deleted_at IS NULL
          WHERE s.deleted_at IS NULL
        ) rep ON r.student_id = rep.id
        LEFT JOIN club c ON r.club_id = c.id AND c.deleted_at IS NULL
        LEFT JOIN (
          SELECT p.id, p.name, p.email, pt2.professor_enum AS professorEnumId
          FROM professor p
          INNER JOIN professor_t pt2 ON p.id = pt2.professor_id
            AND pt2.start_term <= ${cur}
            AND (pt2.end_term > ${cur} OR pt2.end_term IS NULL)
            AND pt2.deleted_at IS NULL
          WHERE p.deleted_at IS NULL
        ) prof ON r.professor_id = prof.id
        LEFT JOIN file f1 ON r.registration_activity_plan_file_id = f1.id AND f1.deleted_at IS NULL
        LEFT JOIN file f2 ON r.registration_club_rule_file_id = f2.id AND f2.deleted_at IS NULL
        LEFT JOIN file f3 ON r.registration_external_instruction_file_id = f3.id AND f3.deleted_at IS NULL
        LEFT JOIN division d ON r.division_id = d.id AND d.deleted_at IS NULL
        WHERE r.id = ${applyId} AND r.deleted_at IS NULL
        FOR SHARE
      `);
        const registration = takeOne(rows);
        if (!registration) {
          throw new HttpException(
            "Registration not found",
            HttpStatus.BAD_REQUEST,
          );
        }
        const comments = await tx.registrationExecutiveComment.findMany({
          where: {
            registrationId: applyId,
            deletedAt: null,
          },
          select: {
            content: true,
            createdAt: true,
          },
        });
        return {
          id: registration.id,
          registrationTypeEnumId: registration.registrationTypeEnumId,
          registrationStatusEnumId: registration.registrationStatusEnumId,
          clubId: registration.clubId,
          clubNameKr: registration.clubNameKr,
          clubNameEn: registration.clubNameEn,
          newClubNameKr: registration.newClubNameKr,
          newClubNameEn: registration.newClubNameEn,
          representative: {
            studentNumber: registration.studentNumber,
            name: registration.representativeName,
            phoneNumber: registration.phoneNumber,
          },
          foundedAt: registration.foundedAt,
          divisionId: registration.divisionId,
          activityFieldKr: registration.activityFieldKr,
          activityFieldEn: registration.activityFieldEn,
          professor: {
            name: registration.professorName,
            email: registration.professorEmail,
            professorEnumId: registration.professorEnumId,
          },
          divisionConsistency: registration.divisionConsistency,
          foundationPurpose: registration.foundationPurpose,
          activityPlan: registration.activityPlan,
          activityPlanFileId: registration.activityPlanFileId,
          clubRuleFileId: registration.clubRuleFileId,
          externalInstructionFileId: registration.externalInstructionFileId,
          isProfessorSigned: !!registration.isProfessorSigned,
          updatedAt: registration.updatedAt,
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
      },
    );
    return result;
  }

  async patchExecutiveRegistrationsClubRegistrationApproval(
    applyId: number,
  ): Promise<ApiReg016ResponseOk> {
    const response = await this.prisma.$transaction(async tx => {
      // 1. 등록 신청 상태를 승인으로 변경
      const result = await tx.registration.updateMany({
        where: {
          id: applyId,
          deletedAt: null,
          registrationApplicationStatusEnumId: {
            in: [
              RegistrationStatusEnum.Pending,
              RegistrationStatusEnum.Rejected,
            ],
          },
        },
        data: {
          registrationApplicationStatusEnumId: RegistrationStatusEnum.Approved,
          reviewedAt: new Date(),
        },
      });
      if (result.count > 1) {
        throw new HttpException("Registration update failed", 500);
      } else if (result.count === 0) {
        throw new HttpException(
          "Registration not found",
          HttpStatus.BAD_REQUEST,
        );
      }

      // 2. 승인된 등록 신청 정보를 조회
      const registration = await tx.registration.findUnique({
        where: { id: applyId },
        include: { semester: true },
      });

      if (!registration || !registration.clubId || !registration.semesterId) {
        throw new HttpException(
          "Registration data incomplete",
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      // 3. 등록 유형에 따라 club_status_enum_id 결정
      // Renewal(1), Promotional(2) → Regular(1), NewProvisional(3), ReProvisional(4) → Provisional(2)
      const clubStatusEnumId =
        registration.registrationApplicationTypeEnumId ===
          RegistrationTypeEnum.Renewal ||
        registration.registrationApplicationTypeEnumId ===
          RegistrationTypeEnum.Promotional
          ? 1 // Regular (정동아리)
          : 2; // Provisional (가동아리)

      // 4. 이미 해당 학기에 club_t 레코드가 있는지 확인
      const existingClubT = await tx.clubT.findFirst({
        where: {
          clubId: registration.clubId,
          semesterId: registration.semesterId,
          deletedAt: null,
        },
      });

      // 5. 없으면 club_t 레코드 생성
      if (!existingClubT) {
        await tx.clubT.create({
          data: {
            clubId: registration.clubId,
            semesterId: registration.semesterId,
            clubStatusEnumId,
            characteristicKr: registration.activityFieldKr,
            characteristicEn: registration.activityFieldEn,
            professorId: registration.professorId,
            startTerm: registration.semester!.startTerm,
            endTerm: registration.semester!.endTerm,
          },
        });
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
    const response = await this.prisma.$transaction(async tx => {
      const result1 = await tx.registration.updateMany({
        where: {
          id: applyId,
          deletedAt: null,
        },
        data: {
          registrationApplicationStatusEnumId: RegistrationStatusEnum.Rejected,
          reviewedAt: new Date(),
        },
      });
      if (result1.count > 1) {
        throw new HttpException("Registration update failed", 500);
      } else if (result1.count === 0) {
        throw new HttpException(
          "Registration not found",
          HttpStatus.BAD_REQUEST,
        );
      }
      const result2 = await tx.registrationExecutiveComment.create({
        data: {
          registrationId: applyId,
          executiveId,
          content: comment,
        },
      });
      if (!result2.id) {
        throw new Error("Comment creation failed, rolling back");
      }
      return {};
    });
    return response;
  }

  async selectRegistrationsAndRepresentativeByProfessorId(param: {
    professorId: number;
  }) {
    const rows = await this.prisma.$queryRaw<
      Array<{
        registrationId: number;
        registrationClubId: number | null;
        registrationSemesterId: number | null;
        registrationApplicationTypeEnumId: number;
        registrationApplicationStatusEnumId: number;
        registrationClubNameKr: string | null;
        registrationClubNameEn: string | null;
        registrationStudentId: number;
        registrationPhoneNumber: string | null;
        registrationFoundedAt: Date;
        registrationDivisionId: number;
        registrationActivityFieldKr: string | null;
        registrationActivityFieldEn: string | null;
        registrationProfessorId: number | null;
        registrationDivisionConsistency: string | null;
        registrationFoundationPurpose: string | null;
        registrationActivityPlan: string | null;
        registrationActivityPlanFileId: string | null;
        registrationClubRuleFileId: string | null;
        registrationExternalInstructionFileId: string | null;
        registrationProfessorApprovedAt: Date | null;
        registrationReviewedAt: Date | null;
        registrationCreatedAt: Date;
        registrationUpdatedAt: Date | null;
        registrationDeletedAt: Date | null;
        clubId: number | null;
        clubNameKr: string | null;
        clubNameEn: string | null;
        studentId: number;
        studentName: string;
        studentNumber: number;
        userId: number | null;
        userName: string | null;
        userEmail: string | null;
        userPhoneNumber: string | null;
        divisionId: number;
        divisionName: string;
      }>
    >(Prisma.sql`
      SELECT
        r.id AS registrationId,
        r.club_id AS registrationClubId,
        r.semester_d_id AS registrationSemesterId,
        r.registration_application_type_enum_id AS registrationApplicationTypeEnumId,
        r.registration_application_status_enum_id AS registrationApplicationStatusEnumId,
        r.club_name_kr AS registrationClubNameKr,
        r.club_name_en AS registrationClubNameEn,
        r.student_id AS registrationStudentId,
        r.phone_number AS registrationPhoneNumber,
        r.founded_at AS registrationFoundedAt,
        r.division_id AS registrationDivisionId,
        r.activity_field_kr AS registrationActivityFieldKr,
        r.activity_field_en AS registrationActivityFieldEn,
        r.professor_id AS registrationProfessorId,
        r.division_consistency AS registrationDivisionConsistency,
        r.foundation_purpose AS registrationFoundationPurpose,
        r.activity_plan AS registrationActivityPlan,
        r.registration_activity_plan_file_id AS registrationActivityPlanFileId,
        r.registration_club_rule_file_id AS registrationClubRuleFileId,
        r.registration_external_instruction_file_id AS registrationExternalInstructionFileId,
        r.professor_approved_at AS registrationProfessorApprovedAt,
        r.reviewed_at AS registrationReviewedAt,
        r.created_at AS registrationCreatedAt,
        r.updated_at AS registrationUpdatedAt,
        r.deleted_at AS registrationDeletedAt,
        c.id AS clubId,
        c.name_kr AS clubNameKr,
        c.name_en AS clubNameEn,
        c.founding_year AS clubFoundingYear,
        c.description AS clubDescription,
        s.id AS studentId,
        s.name AS studentName,
        s.number AS studentNumber,
        u.id AS userId,
        u.name AS userName,
        u.email AS userEmail,
        u.phone_number AS userPhoneNumber,
        d.id AS divisionId,
        d.name AS divisionName
      FROM registration r
      LEFT JOIN club c ON r.club_id = c.id AND c.deleted_at IS NULL
      INNER JOIN student s ON r.student_id = s.id
      LEFT JOIN user u ON u.id = s.user_id
      INNER JOIN division d ON r.division_id = d.id AND d.deleted_at IS NULL
      WHERE r.professor_id = ${param.professorId}
        AND r.deleted_at IS NULL
    `);

    // Map flat SQL results to nested object structure expected by service
    return rows.map(row => ({
      registration: {
        id: row.registrationId,
        clubId: row.registrationClubId,
        semesterId: row.registrationSemesterId,
        registrationApplicationTypeEnumId:
          row.registrationApplicationTypeEnumId,
        registrationApplicationStatusEnumId:
          row.registrationApplicationStatusEnumId,
        clubNameKr: row.registrationClubNameKr,
        clubNameEn: row.registrationClubNameEn,
        studentId: row.registrationStudentId,
        phoneNumber: row.registrationPhoneNumber,
        foundedAt: row.registrationFoundedAt,
        divisionId: row.registrationDivisionId,
        activityFieldKr: row.registrationActivityFieldKr,
        activityFieldEn: row.registrationActivityFieldEn,
        professorId: row.registrationProfessorId,
        divisionConsistency: row.registrationDivisionConsistency,
        foundationPurpose: row.registrationFoundationPurpose,
        activityPlan: row.registrationActivityPlan,
        registrationActivityPlanFileId: row.registrationActivityPlanFileId,
        registrationClubRuleFileId: row.registrationClubRuleFileId,
        registrationExternalInstructionFileId:
          row.registrationExternalInstructionFileId,
        professorApprovedAt: row.registrationProfessorApprovedAt,
        reviewedAt: row.registrationReviewedAt,
        createdAt: row.registrationCreatedAt,
        updatedAt: row.registrationUpdatedAt,
        deletedAt: row.registrationDeletedAt,
      },
      club: {
        nameKr: row.clubNameKr,
        nameEn: row.clubNameEn,
      },
      student: {
        id: row.studentId,
        name: row.studentName,
        number: row.studentNumber,
        email: row.userEmail,
      },
      user: {
        phoneNumber: row.userPhoneNumber,
      },
      division: {
        id: row.divisionId,
        name: row.divisionName,
      },
    }));
  }

  /**
   * @param registrationId 동아리 등록 신청 ID
   * @return 등록 신청 ID가 일치하는 등록 신청들을 배열로 리턴합니다.
   * @description 위 등록 신청 ID 기반으로 조회하기에, 배열의 길이는 1 또는 0이여야 합니다.
   * 이 함수는 이를 검사하지 않습니다.
   */
  async selectRegistrationsById(param: { registrationId: number }) {
    const result = await this.prisma.registration.findMany({
      where: {
        id: param.registrationId,
        deletedAt: null,
      },
    });
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
    const isUpdateSucceed = await this.prisma.$transaction<boolean>(
      async tx => {
        const updateResult = await tx.registration.updateMany({
          where: {
            id: param.registrationId,
            deletedAt: null,
          },
          data: { professorApprovedAt: param.approvedAt },
        });
        if (updateResult.count !== 1)
          throw new HttpException(
            "update failed",
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        return true;
      },
    );
    return isUpdateSucceed;
  }

  async getProfessorRegistrationsClubRegistration(param: {
    registrationId: number;
    professorId: number;
  }) {
    const results = await this.prisma.$queryRaw<
      Array<{
        // registration
        registrationId: number;
        registrationClubId: number | null;
        registrationSemesterId: number | null;
        registrationApplicationTypeEnumId: number;
        registrationApplicationStatusEnumId: number;
        registrationClubNameKr: string | null;
        registrationClubNameEn: string | null;
        registrationStudentId: number;
        registrationPhoneNumber: string | null;
        registrationFoundedAt: Date;
        registrationDivisionId: number;
        registrationActivityFieldKr: string | null;
        registrationActivityFieldEn: string | null;
        registrationProfessorId: number | null;
        registrationDivisionConsistency: string | null;
        registrationFoundationPurpose: string | null;
        registrationActivityPlan: string | null;
        registrationActivityPlanFileId: string | null;
        registrationClubRuleFileId: string | null;
        registrationExternalInstructionFileId: string | null;
        registrationProfessorApprovedAt: Date | null;
        registrationReviewedAt: Date | null;
        registrationCreatedAt: Date;
        registrationUpdatedAt: Date | null;
        registrationDeletedAt: Date | null;
        // student
        studentId: number;
        studentName: string;
        studentNumber: number;
        // club
        clubId: number | null;
        clubNameKr: string | null;
        clubNameEn: string | null;
        // professor
        professorId: number;
        professorName: string;
        professorEmail: string | null;
        // professorT
        professorEnum: number | null;
      }>
    >(Prisma.sql`
      SELECT
        r.id AS registrationId,
        r.club_id AS registrationClubId,
        r.semester_d_id AS registrationSemesterId,
        r.registration_application_type_enum_id AS registrationApplicationTypeEnumId,
        r.registration_application_status_enum_id AS registrationApplicationStatusEnumId,
        r.club_name_kr AS registrationClubNameKr,
        r.club_name_en AS registrationClubNameEn,
        r.student_id AS registrationStudentId,
        r.phone_number AS registrationPhoneNumber,
        r.founded_at AS registrationFoundedAt,
        r.division_id AS registrationDivisionId,
        r.activity_field_kr AS registrationActivityFieldKr,
        r.activity_field_en AS registrationActivityFieldEn,
        r.professor_id AS registrationProfessorId,
        r.division_consistency AS registrationDivisionConsistency,
        r.foundation_purpose AS registrationFoundationPurpose,
        r.activity_plan AS registrationActivityPlan,
        r.registration_activity_plan_file_id AS registrationActivityPlanFileId,
        r.registration_club_rule_file_id AS registrationClubRuleFileId,
        r.registration_external_instruction_file_id AS registrationExternalInstructionFileId,
        r.professor_approved_at AS registrationProfessorApprovedAt,
        r.reviewed_at AS registrationReviewedAt,
        r.created_at AS registrationCreatedAt,
        r.updated_at AS registrationUpdatedAt,
        r.deleted_at AS registrationDeletedAt,
        s.id AS studentId,
        s.name AS studentName,
        s.number AS studentNumber,
        c.id AS clubId,
        c.name_kr AS clubNameKr,
        c.name_en AS clubNameEn,
        p.id AS professorId,
        p.name AS professorName,
        p.email AS professorEmail,
        pt.professor_enum AS professorEnum
      FROM registration r
      INNER JOIN student s ON r.student_id = s.id AND s.deleted_at IS NULL
      INNER JOIN club c ON r.club_id = c.id AND c.deleted_at IS NULL
      INNER JOIN professor p ON r.professor_id = p.id AND p.deleted_at IS NULL
      INNER JOIN professor_t pt ON p.id = pt.professor_id AND pt.deleted_at IS NULL
      WHERE r.id = ${param.registrationId}
        AND r.professor_id = ${param.professorId}
        AND r.deleted_at IS NULL
    `);
    logger.debug(results);
    if (results.length === 0)
      throw new HttpException(
        "not a valid applyId or ProfessorId",
        HttpStatus.NOT_FOUND,
      );
    const row = results[0];

    const comments = await this.prisma.registrationExecutiveComment.findMany({
      where: {
        registrationId: row.registrationId,
        deletedAt: null,
      },
    });

    // Map flat SQL results to nested object structure expected by service
    return {
      registration: {
        id: row.registrationId,
        clubId: row.registrationClubId,
        semesterId: row.registrationSemesterId,
        registrationApplicationTypeEnumId:
          row.registrationApplicationTypeEnumId,
        registrationApplicationStatusEnumId:
          row.registrationApplicationStatusEnumId,
        clubNameKr: row.registrationClubNameKr,
        clubNameEn: row.registrationClubNameEn,
        studentId: row.registrationStudentId,
        phoneNumber: row.registrationPhoneNumber,
        foundedAt: row.registrationFoundedAt,
        divisionId: row.registrationDivisionId,
        activityFieldKr: row.registrationActivityFieldKr,
        activityFieldEn: row.registrationActivityFieldEn,
        professorId: row.registrationProfessorId,
        divisionConsistency: row.registrationDivisionConsistency,
        foundationPurpose: row.registrationFoundationPurpose,
        activityPlan: row.registrationActivityPlan,
        registrationActivityPlanFileId: row.registrationActivityPlanFileId,
        registrationClubRuleFileId: row.registrationClubRuleFileId,
        registrationExternalInstructionFileId:
          row.registrationExternalInstructionFileId,
        professorApprovedAt: row.registrationProfessorApprovedAt,
        reviewedAt: row.registrationReviewedAt,
        createdAt: row.registrationCreatedAt,
        updatedAt: row.registrationUpdatedAt,
        deletedAt: row.registrationDeletedAt,
      },
      club: {
        nameKr: row.clubNameKr,
        nameEn: row.clubNameEn,
      },
      student: {
        id: row.studentId,
        name: row.studentName,
        number: row.studentNumber,
      },
      professor: {
        id: row.professorId,
        name: row.professorName,
        email: row.professorEmail,
      },
      professor_t: {
        professorEnum: row.professorEnum,
      },
      comments,
    };
  }

  async resetClubRegistrationStatusEnum(clubId: number) {
    await this.prisma.$transaction(async tx => {
      await tx.registration.updateMany({
        where: {
          clubId,
          deletedAt: null,
        },
        data: {
          registrationApplicationStatusEnumId: RegistrationStatusEnum.Pending,
          professorApprovedAt: null,
        },
      });
    });
  }

  async selectClubRegistrationDeadline(param: { semesterId: number }) {
    const result = await this.prisma.registrationDeadlineD.findMany({
      where: {
        semesterId: param.semesterId,
        deadlineEnum: RegistrationDeadlineEnum.ClubRegistrationApplication,
        deletedAt: null,
      },
    });
    return result;
  }
}
