import { Injectable } from "@nestjs/common";
import { TransactionHost } from "@nestjs-cls/transactional";
import { Prisma } from "@prisma/client";

import { RegistrationApplicationStudentStatusEnum } from "@clubs/domain/registration/member-registration";

import { PrismaTransactionalAdapter } from "@sparcs-clubs/api/common/transaction/transaction.type";

@Injectable()
export class OverviewRepository {
  constructor(
    private readonly txHost: TransactionHost<PrismaTransactionalAdapter>,
  ) {}

  findClubsFundamentals(year: number, semesterName: string) {
    // Complex multi-table JOIN with dynamic query - use raw SQL
    return this.txHost.tx.$queryRaw<
      Array<{
        clubId: number;
        division: string;
        district: string;
        clubNameKr: string;
        clubNameEn: string;
        clubStatus: number;
      }>
    >(Prisma.sql`
      SELECT c.id AS clubId, d.name AS division, dist.name AS district,
             c.name_kr AS clubNameKr, c.name_en AS clubNameEn,
             ct.club_status_enum_id AS clubStatus
      FROM club_t ct
      INNER JOIN semester_d sd ON sd.id = ct.semester_id
      INNER JOIN club c ON c.id = ct.club_id
      INNER JOIN division d ON d.id = c.division_id
      INNER JOIN district dist ON dist.id = d.district_id
      WHERE ct.deleted_at IS NULL
        AND c.deleted_at IS NULL
        AND sd.year = ${year}
        AND sd.name = ${semesterName}
    `);
  }

  findDelegates(year: number, semesterName: string) {
    // Complex multi-table JOIN query - use raw SQL
    return this.txHost.tx.$queryRaw<
      Array<{
        clubId: number;
        delegateType: number;
        name: string;
        studentNumber: number;
        phoneNumber: string | null;
        kaistEmail: string | null;
        department: string;
      }>
    >(Prisma.sql`
      SELECT c.id AS clubId, cde.id AS delegateType,
             u.name, s.number AS studentNumber,
             u.phone_number AS phoneNumber,
             s.email AS kaistEmail, dep.name AS department
      FROM club_delegate_d cd
      INNER JOIN club_delegate_enum cde ON cde.id = cd.club_delegate_enum_id
      INNER JOIN club_t ct ON ct.club_id = cd.club_id
      INNER JOIN semester_d sd ON sd.id = ct.semester_id
      INNER JOIN club c ON c.id = ct.club_id
      INNER JOIN division d ON d.id = c.division_id
      INNER JOIN district dist ON dist.id = d.district_id
      INNER JOIN student s ON s.id = cd.student_id
      INNER JOIN student_t st ON st.id = cd.student_id AND st.semester_id = sd.id
      INNER JOIN user u ON u.id = s.user_id
      INNER JOIN department dep ON dep.department_id = st.department
      WHERE cd.end_term IS NULL
        AND cd.deleted_at IS NULL
        AND ct.deleted_at IS NULL
        AND c.deleted_at IS NULL
        AND sd.year = ${year}
        AND sd.name = ${semesterName}
    `);
  }

  findClubs(year: number, semesterName: string) {
    const approvedStatus = RegistrationApplicationStudentStatusEnum.Approved;
    // Complex multi-table JOIN with GROUP BY and aggregates - use raw SQL
    return this.txHost.tx.$queryRaw<
      Array<{
        clubId: number;
        division: string;
        district: string | null;
        clubNameKr: string;
        clubNameEn: string;
        clubStatus: number;
        description: string | null;
        characteristicKr: string | null;
        characteristicEn: string | null;
        advisor: string;
        foundingYear: number;
        clubBuildingEnum: number;
        roomLocation: string | null;
        roomPassword: string | null;
        totalMemberCnt: bigint;
        regularMemberCnt: bigint;
      }>
    >(Prisma.sql`
      SELECT c.id AS clubId, d.name AS division, dist.name AS district,
             c.name_kr AS clubNameKr, c.name_en AS clubNameEn,
             ct.club_status_enum_id AS clubStatus,
             c.description, ct.characteristic_kr AS characteristicKr,
             ct.characteristic_en AS characteristicEn,
             u.name AS advisor, c.founding_year AS foundingYear,
             cbe.id AS clubBuildingEnum,
             crt.room_location AS roomLocation,
             crt.room_password AS roomPassword,
             COUNT(DISTINCT cst.student_id) AS totalMemberCnt,
             COUNT(DISTINCT ras.student_id) AS regularMemberCnt
      FROM club_t ct
      INNER JOIN semester_d sd ON sd.id = ct.semester_id
      INNER JOIN club c ON c.id = ct.club_id
      INNER JOIN division d ON d.id = c.division_id
      INNER JOIN district dist ON dist.id = d.district_id
      INNER JOIN professor p ON p.id = ct.professor_id
      INNER JOIN user u ON u.id = p.user_id
      INNER JOIN club_student_t cst ON c.id = cst.club_id AND ct.semester_id = cst.semester_id
      INNER JOIN registration_application_student ras
        ON ras.club_id = ct.club_id
        AND ras.student_id = cst.student_id
        AND ras.registration_application_student_status_enum = ${approvedStatus}
      INNER JOIN club_room_t crt ON crt.club_id = ct.club_id AND crt.semester_id = ct.semester_id
      INNER JOIN club_building_enum cbe ON cbe.id = crt.club_building_enum
      WHERE ct.deleted_at IS NULL
        AND c.deleted_at IS NULL
        AND p.deleted_at IS NULL
        AND sd.year = ${year}
        AND sd.name = ${semesterName}
      GROUP BY ct.id, crt.club_building_enum, crt.room_location, crt.room_password
    `);
  }
}
