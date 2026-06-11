import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { RegistrationApplicationStudentStatusEnum } from "@clubs/domain/registration/member-registration";

import { PrismaService } from "@sparcs-clubs/api/prisma/prisma.service";

@Injectable()
export class OverviewRepository {
  constructor(private readonly prisma: PrismaService) {}

  findClubsFundamentals(year: number, semesterName: string) {
    // Complex multi-table JOIN with dynamic query - use raw SQL
    return this.prisma.$queryRaw<
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

  async findDelegates(year: number, semesterName: string) {
    const semester = await this.prisma.semesterD.findFirst({
      where: { year, name: semesterName, deletedAt: null },
      select: { id: true },
    });

    if (!semester) {
      return [];
    }

    const delegates = await this.prisma.clubDelegateD.findMany({
      where: {
        endTerm: null,
        deletedAt: null,
        club: {
          deletedAt: null,
          clubTs: {
            some: { semesterId: semester.id, deletedAt: null },
          },
        },
      },
      select: {
        clubId: true,
        clubDelegateEnum: true,
        student: {
          select: {
            number: true,
            name: true,
            email: true,
            user: {
              select: {
                name: true,
                phoneNumber: true,
              },
            },
            studentTs: {
              where: { semesterId: semester.id, deletedAt: null },
              select: { department: true },
              take: 1,
            },
          },
        },
      },
    });

    const departmentIds = Array.from(
      new Set(
        delegates
          .map(delegate => delegate.student.studentTs[0]?.department)
          .filter(
            (department): department is number =>
              typeof department === "number",
          ),
      ),
    );
    const departments = await this.prisma.department.findMany({
      where: { departmentId: { in: departmentIds }, deletedAt: null },
      select: { departmentId: true, name: true },
    });
    const departmentNameById = new Map(
      departments
        .filter(department => typeof department.departmentId === "number")
        .map(department => [department.departmentId, department.name]),
    );

    return delegates.map(delegate => {
      const departmentId = delegate.student.studentTs[0]?.department;

      return {
        clubId: delegate.clubId,
        delegateType: delegate.clubDelegateEnum,
        name: delegate.student.user?.name ?? delegate.student.name,
        studentNumber: delegate.student.number,
        phoneNumber: delegate.student.user?.phoneNumber ?? null,
        kaistEmail: delegate.student.email,
        department: departmentNameById.get(departmentId) ?? "",
      };
    });
  }

  findClubs(year: number, semesterName: string) {
    const approvedStatus = RegistrationApplicationStudentStatusEnum.Approved;
    // Complex multi-table JOIN with GROUP BY and aggregates - use raw SQL
    return this.prisma.$queryRaw<
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
