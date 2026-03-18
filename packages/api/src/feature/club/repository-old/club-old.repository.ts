import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { ISemester } from "@clubs/domain/semester/semester";

import type { ApiClb001ResponseOK } from "@clubs/interface/api/club/endpoint/apiClb001";
import { IDivision } from "@clubs/interface/api/division/type/division.type";
import {
  ClubDelegateEnum,
  ClubTypeEnum,
} from "@clubs/interface/common/enum/club.enum";

import { PrismaTransactionClient } from "@sparcs-clubs/api/common/base/base.repository";
import { takeOne } from "@sparcs-clubs/api/common/util/util";
import { PrismaService } from "@sparcs-clubs/api/prisma/prisma.service";

import { VClubSummary } from "../model/club.summary.model";
import { MClubOld } from "../model/club-old.model";

interface IClubs {
  id: number;
  name: string;
  districtId: number;
  clubs: {
    type: number;
    id: number;
    nameKr: string;
    nameEn: string;
    isPermanent: boolean;
    characteristic: string;
    representative: string;
    advisor: string;
    totalMemberCnt: number;
  }[];
}

@Injectable()
export class ClubOldRepository {
  constructor(private readonly prisma: PrismaService) {}

  // clubId가 일치하는 club을 리스트로 가져옵니다.
  async findByClubId(clubId: number) {
    const clubList = await this.prisma.club.findMany({
      where: { id: clubId },
      take: 1,
    });

    return clubList;
  }

  async findClubDetail(clubId: number) {
    const clubInfoRows = await this.prisma.$queryRaw<
      Array<{
        id: number;
        nameKr: string;
        nameEn: string;
        type: number;
        characteristic: string | null;
        advisor: string | null;
        description: string | null;
        foundingYear: number;
      }>
    >(Prisma.sql`
      SELECT c.id AS id,
             c.name_kr AS nameKr,
             c.name_en AS nameEn,
             ct.club_status_enum_id AS type,
             ct.characteristic_kr AS characteristic,
             p.name AS advisor,
             c.description AS description,
             c.founding_year AS foundingYear
      FROM club c
      LEFT JOIN club_t ct ON ct.club_id = c.id
      LEFT JOIN professor p ON p.id = ct.professor_id
      WHERE c.id = ${clubId}
        AND (
          (ct.end_term IS NULL AND ct.start_term <= NOW())
          OR ct.end_term >= NOW()
        )
        AND (ct.club_status_enum_id = 1 OR ct.club_status_enum_id = 2)
      LIMIT 1
    `);
    const clubInfo = takeOne(clubInfoRows);

    const divisionRows = await this.prisma.$queryRaw<
      Array<{
        id: number;
        name: string;
      }>
    >(Prisma.sql`
      SELECT d.id AS id, d.name AS name
      FROM club c
      LEFT JOIN division d ON d.id = c.division_id
      WHERE c.id = ${clubId}
      LIMIT 1
    `);
    const division = takeOne(divisionRows);
    return { ...clubInfo, division };
  }

  async getAllClubsGroupedByDivision(): Promise<ApiClb001ResponseOK> {
    const clubs = await this.prisma.$queryRaw<
      Array<{
        divId: number;
        districtId: number;
        divName: string;
        type: number;
        clubId: number;
        nameKr: string;
        nameEn: string;
        isPermanent: number | null;
        characteristic: string | null;
        representative: string | null;
        advisor: string | null;
        totalMemberCnt: bigint;
      }>
    >(Prisma.sql`
      SELECT d.id AS divId,
             d.district_id AS districtId,
             d.name AS divName,
             ct.club_status_enum_id AS type,
             c.id AS clubId,
             c.name_kr AS nameKr,
             c.name_en AS nameEn,
             dpcd.id AS isPermanent,
             ct.characteristic_kr AS characteristic,
             s.name AS representative,
             p.name AS advisor,
             COUNT(cst.id) AS totalMemberCnt
      FROM division d
      LEFT JOIN club c ON c.division_id = d.id
      INNER JOIN club_t ct ON c.id = ct.club_id
        AND (
          (ct.end_term IS NULL AND ct.start_term <= NOW())
          OR ct.end_term >= NOW()
        )
        AND (ct.club_status_enum_id = 1 OR ct.club_status_enum_id = 2)
        AND ct.deleted_at IS NULL
      LEFT JOIN professor p ON ct.professor_id = p.id
      LEFT JOIN club_student_t cst ON c.id = cst.club_id
        AND cst.start_term <= NOW()
        AND (cst.end_term IS NULL OR cst.end_term >= NOW())
        AND cst.deleted_at IS NULL
      LEFT JOIN club_delegate_d cdd ON c.id = cdd.club_id
        AND cdd.club_delegate_enum_id = 1
        AND cdd.start_term <= NOW()
        AND (cdd.end_term IS NULL OR cdd.end_term >= NOW())
        AND cdd.deleted_at IS NULL
      LEFT JOIN student s ON cdd.student_id = s.id
      LEFT JOIN division_permanent_club_d dpcd ON dpcd.club_id = c.id
        AND dpcd.start_term <= NOW()
        AND (dpcd.end_term >= NOW() OR dpcd.end_term IS NULL)
      GROUP BY d.id, d.name, c.id, c.name_kr, c.name_en,
               ct.club_status_enum_id, ct.characteristic_kr,
               s.name, p.name, dpcd.id
    `);

    const stackedClubs = clubs.reduce<Record<number, IClubs>>((acc, row) => {
      acc[row.divId] ??= {
        id: row.divId,
        name: row.divName,
        clubs: [],
        districtId: row.districtId,
      };

      if (row.clubId) {
        acc[row.divId].clubs.push({
          type: row.type,
          id: row.clubId,
          nameKr: row.nameKr,
          nameEn: row.nameEn,
          isPermanent: row.isPermanent !== null,
          characteristic: row.characteristic,
          representative: row.representative,
          advisor: row.advisor,
          totalMemberCnt: Number(row.totalMemberCnt),
        });
      }
      return acc;
    }, {});

    const sortedClubs = Object.values(stackedClubs)
      .sort((a, b) => {
        if (a.districtId !== b.districtId) {
          return a.districtId - b.districtId;
        }
        return a.name.localeCompare(b.name);
      })
      .map(({ districtId: _districtId, ...rest }) => rest);

    const result = {
      divisions: sortedClubs,
    };

    return result;
  }

  async findClubActivities(studentId: number): Promise<{
    clubs: {
      id: number;
      nameKr: string;
      nameEn: string;
      dateRange: { startMonth: Date; endMonth: Date | undefined }[];
    }[];
  }> {
    const rows = await this.prisma.$queryRaw<
      Array<{
        clubId: number;
        nameKr: string;
        nameEn: string;
        startTerm: Date;
        endTerm: Date | null;
      }>
    >(Prisma.sql`
      SELECT cst.club_id AS clubId,
             c.name_kr AS nameKr,
             c.name_en AS nameEn,
             cst.start_term AS startTerm,
             cst.end_term AS endTerm
      FROM club_student_t cst
      LEFT JOIN club c ON c.id = cst.club_id
      WHERE cst.student_id = ${studentId}
    `);

    const clubActivities = rows.map(row => ({
      id: row.clubId,
      nameKr: row.nameKr,
      nameEn: row.nameEn,
      startMonth: row.startTerm,
      endMonth: row.endTerm,
    }));

    const groupedActivities = clubActivities.reduce(
      (acc, activity) => {
        const { id, nameKr, nameEn, startMonth, endMonth } = activity;

        const updatedAcc = { ...acc };
        if (!updatedAcc[id]) {
          updatedAcc[id] = {
            id,
            nameKr,
            nameEn,
            dateRange: [{ startMonth, endMonth }],
          };
          return updatedAcc;
        }

        let updated = false;
        const { dateRange } = acc[id];

        for (let i = 0; i < dateRange.length; i += 1) {
          const dates = dateRange[i];

          if (
            startMonth.getTime() - dates.endMonth.getTime() ===
            24 * 60 * 60 * 1000
          ) {
            dates.endMonth = endMonth;
            updated = true;
            break;
          }
        }

        if (!updated) {
          acc[id].dateRange.push({ startMonth, endMonth });
        }

        return acc;
      },
      {} as {
        [key: number]: {
          id: number;
          nameKr: string;
          nameEn: string;
          dateRange: { startMonth: Date; endMonth: Date | undefined }[];
        };
      },
    );
    return { clubs: Object.values(groupedActivities) };
  }

  async findClubName(
    clubId: number,
  ): Promise<{ nameKr: string; nameEn: string }> {
    const result = await this.prisma.club.findMany({
      where: { id: clubId },
      select: { nameKr: true, nameEn: true },
    });
    return result[0]
      ? { nameKr: result[0].nameKr, nameEn: result[0].nameEn }
      : undefined;
  }

  async findClubIdByClubStatusEnumId(
    studentId: number,
    clubStatusEnumIds: Array<ClubTypeEnum>,
    semesterId: number,
  ) {
    const result = await this.prisma.$transaction(
      async (tx: PrismaTransactionClient) => {
        const club = await tx.$queryRaw<
          Array<{
            id: number;
            clubNameKr: string;
            clubNameEn: string;
            professorName: string | null;
            professorEmail: string | null;
            professorEnumId: number | null;
          }>
        >(Prisma.sql`
          SELECT DISTINCT c.id AS id,
                 c.name_kr AS clubNameKr,
                 c.name_en AS clubNameEn,
                 prof.name AS professorName,
                 prof.email AS professorEmail,
                 pt.professor_enum AS professorEnumId
          FROM club c
          INNER JOIN club_t ct ON c.id = ct.club_id
            AND ct.semester_id = ${semesterId}
            AND ct.deleted_at IS NULL
            AND ct.club_status_enum_id IN (${Prisma.join(clubStatusEnumIds)})
          LEFT JOIN (
            SELECT p.id, p.name, p.email
            FROM professor p
            INNER JOIN professor_t pt ON p.id = pt.professor_id
              AND pt.start_term <= NOW()
              AND (pt.end_term > NOW() OR pt.end_term IS NULL)
              AND pt.deleted_at IS NULL
            WHERE p.deleted_at IS NULL
          ) AS prof ON prof.id = ct.professor_id
          LEFT JOIN professor_t pt ON pt.professor_id = prof.id
            AND pt.start_term <= NOW()
            AND (pt.end_term > NOW() OR pt.end_term IS NULL)
            AND pt.deleted_at IS NULL
          WHERE c.id IN (
            SELECT cdd.club_id
            FROM club_delegate_d cdd
            WHERE cdd.student_id = ${studentId}
              AND cdd.start_term <= NOW()
              AND (cdd.end_term >= NOW() OR cdd.end_term IS NULL)
              AND cdd.deleted_at IS NULL
          )
          AND c.deleted_at IS NULL
        `);

        return club.map(row => ({
          id: row.id,
          clubNameKr: row.clubNameKr,
          clubNameEn: row.clubNameEn,
          professor: {
            name: row.professorName,
            email: row.professorEmail,
            professorEnumId: row.professorEnumId,
          },
        }));
      },
    );
    return result;
  }

  async findEligibleClubsForRegistration(
    studentId: number,
    semesterId: number,
  ) {
    // 주어진 semesterId를 기준으로 최근 2학기와 3학기를 계산
    const recentTwoSemesters = [semesterId - 1, semesterId];
    const { length } = recentTwoSemesters;
    const recentThreeSemesters = [semesterId - 2, semesterId - 1, semesterId];

    const result = await this.prisma.$transaction(
      async (tx: PrismaTransactionClient) => {
        const response = await tx.$queryRaw<
          Array<{
            id: number;
            clubNameKr: string;
            clubNameEn: string;
            professorName: string | null;
            professorEmail: string | null;
            professorEnumId: number | null;
          }>
        >(Prisma.sql`
          SELECT DISTINCT c.id AS id,
                 c.name_kr AS clubNameKr,
                 c.name_en AS clubNameEn,
                 prof.name AS professorName,
                 prof.email AS professorEmail,
                 pt.professor_enum AS professorEnumId
          FROM club c
          INNER JOIN club_t ct ON c.id = ct.club_id
            AND ct.club_id IN (
              SELECT sq.id FROM (
                SELECT c2.id
                FROM club c2
                INNER JOIN club_t ct2 ON c2.id = ct2.club_id
                WHERE ct2.club_status_enum_id = ${ClubTypeEnum.Provisional}
                  AND ct2.semester_id IN (${Prisma.join(recentTwoSemesters)})
                  AND c2.id IN (
                    SELECT cdd.club_id
                    FROM club_delegate_d cdd
                    WHERE cdd.student_id = ${studentId}
                      AND cdd.start_term <= NOW()
                      AND (cdd.end_term >= NOW() OR cdd.end_term IS NULL)
                      AND cdd.deleted_at IS NULL
                  )
                  AND ct2.deleted_at IS NULL
                GROUP BY c2.id
                HAVING COUNT(DISTINCT ct2.semester_id) = ${length}

                UNION

                SELECT c3.id
                FROM club c3
                INNER JOIN club_t ct3 ON c3.id = ct3.club_id
                WHERE ct3.club_status_enum_id = ${ClubTypeEnum.Regular}
                  AND ct3.semester_id IN (${Prisma.join(recentThreeSemesters)})
                  AND c3.id IN (
                    SELECT cdd.club_id
                    FROM club_delegate_d cdd
                    WHERE cdd.student_id = ${studentId}
                      AND cdd.start_term <= NOW()
                      AND (cdd.end_term >= NOW() OR cdd.end_term IS NULL)
                      AND cdd.deleted_at IS NULL
                  )
                  AND ct3.deleted_at IS NULL
                GROUP BY c3.id
              ) AS sq
            )
            AND ct.start_term <= NOW()
            AND ct.deleted_at IS NULL
            AND (ct.end_term IS NULL OR ct.end_term > NOW())
          LEFT JOIN (
            SELECT p.id, p.name, p.email
            FROM professor p
            INNER JOIN professor_t ppt ON p.id = ppt.professor_id
              AND ppt.start_term <= NOW()
              AND (ppt.end_term > NOW() OR ppt.end_term IS NULL)
              AND ppt.deleted_at IS NULL
            WHERE p.deleted_at IS NULL
          ) AS prof ON prof.id = ct.professor_id
          LEFT JOIN professor_t pt ON pt.professor_id = prof.id
            AND pt.start_term <= NOW()
            AND (pt.end_term > NOW() OR pt.end_term IS NULL)
            AND pt.deleted_at IS NULL
          WHERE c.deleted_at IS NULL
        `);

        return response.map(row => ({
          id: row.id,
          clubNameKr: row.clubNameKr,
          clubNameEn: row.clubNameEn,
          professor: {
            name: row.professorName,
            email: row.professorEmail,
            professorEnumId: row.professorEnumId,
          },
        }));
      },
    );
    return result;
  }

  async fetchSummary(clubId: number): Promise<VClubSummary> {
    const result = await this.prisma.$queryRaw<
      Array<{
        clubId: number;
        nameKr: string;
        nameEn: string;
        description: string | null;
        foundingYear: number;
        divisionId: number;
        clubCreatedAt: Date | null;
        clubDeletedAt: Date | null;
        ctId: number | null;
        clubStatusEnumId: number | null;
        characteristicKr: string | null;
        characteristicEn: string | null;
        professorId: number | null;
        semesterId: number | null;
        ctStartTerm: Date | null;
        ctEndTerm: Date | null;
        ctCreatedAt: Date | null;
        ctDeletedAt: Date | null;
      }>
    >(Prisma.sql`
      SELECT c.id AS clubId,
             c.name_kr AS nameKr,
             c.name_en AS nameEn,
             c.description AS description,
             c.founding_year AS foundingYear,
             c.division_id AS divisionId,
             c.created_at AS clubCreatedAt,
             c.deleted_at AS clubDeletedAt,
             ct.id AS ctId,
             ct.club_status_enum_id AS clubStatusEnumId,
             ct.characteristic_kr AS characteristicKr,
             ct.characteristic_en AS characteristicEn,
             ct.professor_id AS professorId,
             ct.semester_id AS semesterId,
             ct.start_term AS ctStartTerm,
             ct.end_term AS ctEndTerm,
             ct.created_at AS ctCreatedAt,
             ct.deleted_at AS ctDeletedAt
      FROM club c
      LEFT JOIN club_t ct ON c.id = ct.club_id
      WHERE c.id = ${clubId}
        AND c.deleted_at IS NULL
        AND ct.deleted_at IS NULL
      ORDER BY ct.start_term DESC
      LIMIT 1
    `);

    if (result.length !== 1) {
      throw new NotFoundException("ClubOld not found");
    }

    const row = result[0];
    return VClubSummary.fromDBResult({
      club: {
        id: row.clubId,
        nameKr: row.nameKr,
        nameEn: row.nameEn,
        divisionId: row.divisionId,
        description: row.description,
        foundingYear: row.foundingYear,
        createdAt: row.clubCreatedAt,
        deletedAt: row.clubDeletedAt,
      },
      club_t: row.ctId
        ? {
            id: row.ctId,
            clubId: row.clubId,
            clubStatusEnumId: row.clubStatusEnumId,
            characteristicKr: row.characteristicKr,
            characteristicEn: row.characteristicEn,
            professorId: row.professorId,
            semesterId: row.semesterId,
            startTerm: row.ctStartTerm,
            endTerm: row.ctEndTerm,
            createdAt: row.ctCreatedAt,
            deletedAt: row.ctDeletedAt,
          }
        : undefined,
    });
  }

  async fetchSummaries(
    clubIds: number[],
    semesterIds?: number[],
  ): Promise<VClubSummary[]> {
    if (clubIds.length === 0) {
      return [];
    }

    const whereConditions: Prisma.Sql[] = [];

    whereConditions.push(Prisma.sql`c.id IN (${Prisma.join(clubIds)})`);

    if (semesterIds && semesterIds.length > 0) {
      whereConditions.push(
        Prisma.sql`ct.semester_id IN (${Prisma.join(semesterIds)})`,
      );
    } else {
      whereConditions.push(
        Prisma.sql`ct.start_term <= NOW() AND (ct.end_term >= NOW() OR ct.end_term IS NULL)`,
      );
    }
    whereConditions.push(Prisma.sql`c.deleted_at IS NULL`);
    whereConditions.push(Prisma.sql`ct.deleted_at IS NULL`);

    const whereClause = Prisma.sql`${Prisma.join(whereConditions, " AND ")}`;

    const result = await this.prisma.$queryRaw<
      Array<{
        clubId: number;
        nameKr: string;
        nameEn: string;
        description: string | null;
        foundingYear: number;
        divisionId: number;
        clubCreatedAt: Date | null;
        clubDeletedAt: Date | null;
        ctId: number | null;
        clubStatusEnumId: number | null;
        characteristicKr: string | null;
        characteristicEn: string | null;
        professorId: number | null;
        semesterId: number | null;
        ctStartTerm: Date | null;
        ctEndTerm: Date | null;
        ctCreatedAt: Date | null;
        ctDeletedAt: Date | null;
      }>
    >(Prisma.sql`
      SELECT c.id AS clubId,
             c.name_kr AS nameKr,
             c.name_en AS nameEn,
             c.description AS description,
             c.founding_year AS foundingYear,
             c.division_id AS divisionId,
             c.created_at AS clubCreatedAt,
             c.deleted_at AS clubDeletedAt,
             ct.id AS ctId,
             ct.club_status_enum_id AS clubStatusEnumId,
             ct.characteristic_kr AS characteristicKr,
             ct.characteristic_en AS characteristicEn,
             ct.professor_id AS professorId,
             ct.semester_id AS semesterId,
             ct.start_term AS ctStartTerm,
             ct.end_term AS ctEndTerm,
             ct.created_at AS ctCreatedAt,
             ct.deleted_at AS ctDeletedAt
      FROM club c
      LEFT JOIN club_t ct ON c.id = ct.club_id
      WHERE ${whereClause}
    `);

    return result.map(row =>
      VClubSummary.fromDBResult({
        club: {
          id: row.clubId,
          nameKr: row.nameKr,
          nameEn: row.nameEn,
          divisionId: row.divisionId,
          description: row.description,
          foundingYear: row.foundingYear,
          createdAt: row.clubCreatedAt,
          deletedAt: row.clubDeletedAt,
        },
        club_t: row.ctId
          ? {
              id: row.ctId,
              clubId: row.clubId,
              clubStatusEnumId: row.clubStatusEnumId,
              characteristicKr: row.characteristicKr,
              characteristicEn: row.characteristicEn,
              professorId: row.professorId,
              semesterId: row.semesterId,
              startTerm: row.ctStartTerm,
              endTerm: row.ctEndTerm,
              createdAt: row.ctCreatedAt,
              deletedAt: row.ctDeletedAt,
            }
          : undefined,
      }),
    );
  }

  async findOne(
    clubId: number,
    semester: ISemester,
    date?: Date,
  ): Promise<MClubOld | null> {
    const day = date ?? new Date(semester.endTerm);

    // club query
    const clubResult = await this.prisma.$queryRaw<
      Array<{
        clubId: number;
        nameKr: string;
        nameEn: string;
        divisionId: number;
        description: string | null;
        foundingYear: number;
        clubCreatedAt: Date | null;
        clubDeletedAt: Date | null;
        ctId: number;
        ctClubId: number;
        clubStatusEnumId: number;
        characteristicKr: string | null;
        characteristicEn: string | null;
        professorId: number | null;
        semesterId: number;
        ctStartTerm: Date;
        ctEndTerm: Date | null;
        ctCreatedAt: Date | null;
        ctDeletedAt: Date | null;
        crtId: number | null;
        crtClubId: number | null;
        crtClubBuildingEnum: number | null;
        crtRoomLocation: string | null;
        crtRoomPassword: string | null;
        crtSemesterId: number | null;
        crtStartTerm: Date | null;
        crtEndTerm: Date | null;
        crtCreatedAt: Date | null;
        crtDeletedAt: Date | null;
      }>
    >(Prisma.sql`
      SELECT c.id AS clubId,
             c.name_kr AS nameKr,
             c.name_en AS nameEn,
             c.division_id AS divisionId,
             c.description AS description,
             c.founding_year AS foundingYear,
             c.created_at AS clubCreatedAt,
             c.deleted_at AS clubDeletedAt,
             ct.id AS ctId,
             ct.club_id AS ctClubId,
             ct.club_status_enum_id AS clubStatusEnumId,
             ct.characteristic_kr AS characteristicKr,
             ct.characteristic_en AS characteristicEn,
             ct.professor_id AS professorId,
             ct.semester_id AS semesterId,
             ct.start_term AS ctStartTerm,
             ct.end_term AS ctEndTerm,
             ct.created_at AS ctCreatedAt,
             ct.deleted_at AS ctDeletedAt,
             crt.id AS crtId,
             crt.club_id AS crtClubId,
             crt.club_building_enum AS crtClubBuildingEnum,
             crt.room_location AS crtRoomLocation,
             crt.room_password AS crtRoomPassword,
             crt.semester_id AS crtSemesterId,
             crt.start_term AS crtStartTerm,
             crt.end_term AS crtEndTerm,
             crt.created_at AS crtCreatedAt,
             crt.deleted_at AS crtDeletedAt
      FROM club c
      INNER JOIN club_t ct ON c.id = ct.club_id
      LEFT JOIN club_room_t crt ON c.id = crt.club_id AND ct.semester_id = crt.semester_id
      WHERE c.id = ${clubId}
        AND ct.semester_id = ${semester.id}
        AND ct.deleted_at IS NULL
    `);

    // delegate query
    const delegateResult = await this.prisma.$queryRaw<
      Array<{
        id: number;
        clubId: number;
        studentId: number;
        clubDelegateEnum: number;
        startTerm: Date;
        endTerm: Date | null;
        createdAt: Date | null;
        deletedAt: Date | null;
      }>
    >(Prisma.sql`
      SELECT id, club_id AS clubId, student_id AS studentId,
             club_delegate_enum_id AS clubDelegateEnum,
             start_term AS startTerm, end_term AS endTerm,
             created_at AS createdAt, deleted_at AS deletedAt
      FROM club_delegate_d
      WHERE club_id = ${clubId}
        AND start_term <= ${day}
        AND (end_term >= ${day} OR end_term IS NULL)
        AND deleted_at IS NULL
    `);

    if (clubResult.length !== 1) {
      return null;
    }

    if (
      !delegateResult.some(
        e => e.clubDelegateEnum === ClubDelegateEnum.Representative,
      )
    ) {
      return null;
    }

    const row = clubResult[0];
    return MClubOld.fromDBResult({
      club: {
        id: row.clubId,
        nameKr: row.nameKr,
        nameEn: row.nameEn,
        divisionId: row.divisionId,
        description: row.description,
        foundingYear: row.foundingYear,
        createdAt: row.clubCreatedAt,
        deletedAt: row.clubDeletedAt,
      },
      club_t: {
        id: row.ctId,
        clubId: row.ctClubId,
        clubStatusEnumId: row.clubStatusEnumId,
        characteristicKr: row.characteristicKr,
        characteristicEn: row.characteristicEn,
        professorId: row.professorId,
        semesterId: row.semesterId,
        startTerm: row.ctStartTerm,
        endTerm: row.ctEndTerm,
        createdAt: row.ctCreatedAt,
        deletedAt: row.ctDeletedAt,
      },
      club_room_t: row.crtId
        ? {
            id: row.crtId,
            clubId: row.crtClubId,
            clubBuildingEnum: row.crtClubBuildingEnum,
            roomLocation: row.crtRoomLocation,
            roomPassword: row.crtRoomPassword,
            semesterId: row.crtSemesterId,
            startTerm: row.crtStartTerm,
            endTerm: row.crtEndTerm,
            createdAt: row.crtCreatedAt,
            deletedAt: row.crtDeletedAt,
          }
        : null,
      club_delegate_d: delegateResult,
    });
  }

  async find(param: {
    id?: IClubs["id"];
    ids?: IClubs["id"][];
    semester: ISemester;
    clubStatusEnumId?: ClubTypeEnum;
    clubStatusEnumIds?: ClubTypeEnum[];
    divisionId?: IDivision["id"];
    date?: Date;
  }): Promise<MClubOld[]> {
    if (!param.semester) {
      throw new BadRequestException("Semester or date is required");
    }
    const day = param.date ?? new Date(param.semester.endTerm);

    // Build dynamic WHERE conditions for club query
    const clubConditions: Prisma.Sql[] = [];
    const delegateConditions: Prisma.Sql[] = [];

    if (param.id) {
      clubConditions.push(Prisma.sql`c.id = ${param.id}`);
      delegateConditions.push(Prisma.sql`club_id = ${param.id}`);
    }

    if (param.ids) {
      clubConditions.push(Prisma.sql`c.id IN (${Prisma.join(param.ids)})`);
      delegateConditions.push(
        Prisma.sql`club_id IN (${Prisma.join(param.ids)})`,
      );
    }

    if (param.semester) {
      clubConditions.push(Prisma.sql`ct.semester_id = ${param.semester.id}`);
    }

    if (param.clubStatusEnumId) {
      clubConditions.push(
        Prisma.sql`ct.club_status_enum_id = ${param.clubStatusEnumId}`,
      );
    }

    if (param.clubStatusEnumIds) {
      clubConditions.push(
        Prisma.sql`ct.club_status_enum_id IN (${Prisma.join(param.clubStatusEnumIds)})`,
      );
    }

    if (param.divisionId) {
      clubConditions.push(Prisma.sql`c.division_id = ${param.divisionId}`);
    }

    clubConditions.push(Prisma.sql`c.deleted_at IS NULL`);
    clubConditions.push(Prisma.sql`ct.deleted_at IS NULL`);

    delegateConditions.push(Prisma.sql`start_term <= ${day}`);
    delegateConditions.push(
      Prisma.sql`(end_term >= ${day} OR end_term IS NULL)`,
    );

    const clubWhereClause = Prisma.join(clubConditions, " AND ");
    const delegateWhereClause = Prisma.join(delegateConditions, " AND ");

    const [clubResult, delegateResult] = await Promise.all([
      this.prisma.$queryRaw<
        Array<{
          clubId: number;
          nameKr: string;
          nameEn: string;
          divisionId: number;
          description: string | null;
          foundingYear: number;
          clubCreatedAt: Date | null;
          clubDeletedAt: Date | null;
          ctId: number;
          ctClubId: number;
          clubStatusEnumId: number;
          characteristicKr: string | null;
          characteristicEn: string | null;
          professorId: number | null;
          semesterId: number;
          ctStartTerm: Date;
          ctEndTerm: Date | null;
          ctCreatedAt: Date | null;
          ctDeletedAt: Date | null;
          crtId: number | null;
          crtClubId: number | null;
          crtClubBuildingEnum: number | null;
          crtRoomLocation: string | null;
          crtRoomPassword: string | null;
          crtSemesterId: number | null;
          crtStartTerm: Date | null;
          crtEndTerm: Date | null;
          crtCreatedAt: Date | null;
          crtDeletedAt: Date | null;
        }>
      >(Prisma.sql`
        SELECT c.id AS clubId,
               c.name_kr AS nameKr,
               c.name_en AS nameEn,
               c.division_id AS divisionId,
               c.description AS description,
               c.founding_year AS foundingYear,
               c.created_at AS clubCreatedAt,
               c.deleted_at AS clubDeletedAt,
               ct.id AS ctId,
               ct.club_id AS ctClubId,
               ct.club_status_enum_id AS clubStatusEnumId,
               ct.characteristic_kr AS characteristicKr,
               ct.characteristic_en AS characteristicEn,
               ct.professor_id AS professorId,
               ct.semester_id AS semesterId,
               ct.start_term AS ctStartTerm,
               ct.end_term AS ctEndTerm,
               ct.created_at AS ctCreatedAt,
               ct.deleted_at AS ctDeletedAt,
               crt.id AS crtId,
               crt.club_id AS crtClubId,
               crt.club_building_enum AS crtClubBuildingEnum,
               crt.room_location AS crtRoomLocation,
               crt.room_password AS crtRoomPassword,
               crt.semester_id AS crtSemesterId,
               crt.start_term AS crtStartTerm,
               crt.end_term AS crtEndTerm,
               crt.created_at AS crtCreatedAt,
               crt.deleted_at AS crtDeletedAt
        FROM club c
        INNER JOIN club_t ct ON c.id = ct.club_id
        LEFT JOIN club_room_t crt ON c.id = crt.club_id AND ct.semester_id = crt.semester_id
        WHERE ${clubWhereClause}
      `),
      this.prisma.$queryRaw<
        Array<{
          id: number;
          clubId: number;
          studentId: number;
          clubDelegateEnum: number;
          startTerm: Date;
          endTerm: Date | null;
          createdAt: Date | null;
          deletedAt: Date | null;
        }>
      >(Prisma.sql`
        SELECT id, club_id AS clubId, student_id AS studentId,
               club_delegate_enum_id AS clubDelegateEnum,
               start_term AS startTerm, end_term AS endTerm,
               created_at AS createdAt, deleted_at AS deletedAt
        FROM club_delegate_d
        WHERE ${delegateWhereClause}
      `),
    ]);

    return clubResult.map(row =>
      MClubOld.fromDBResult({
        club: {
          id: row.clubId,
          nameKr: row.nameKr,
          nameEn: row.nameEn,
          divisionId: row.divisionId,
          description: row.description,
          foundingYear: row.foundingYear,
          createdAt: row.clubCreatedAt,
          deletedAt: row.clubDeletedAt,
        },
        club_t: {
          id: row.ctId,
          clubId: row.ctClubId,
          clubStatusEnumId: row.clubStatusEnumId,
          characteristicKr: row.characteristicKr,
          characteristicEn: row.characteristicEn,
          professorId: row.professorId,
          semesterId: row.semesterId,
          startTerm: row.ctStartTerm,
          endTerm: row.ctEndTerm,
          createdAt: row.ctCreatedAt,
          deletedAt: row.ctDeletedAt,
        },
        club_room_t: row.crtId
          ? {
              id: row.crtId,
              clubId: row.crtClubId,
              clubBuildingEnum: row.crtClubBuildingEnum,
              roomLocation: row.crtRoomLocation,
              roomPassword: row.crtRoomPassword,
              semesterId: row.crtSemesterId,
              startTerm: row.crtStartTerm,
              endTerm: row.crtEndTerm,
              createdAt: row.crtCreatedAt,
              deletedAt: row.crtDeletedAt,
            }
          : null,
        club_delegate_d: delegateResult.filter(e => e.clubId === row.clubId),
      }),
    );
  }

  async fetch(
    clubId: number,
    semester: ISemester,
    date?: Date,
  ): Promise<MClubOld> {
    const result = await this.findOne(clubId, semester, date);
    if (!result) {
      throw new NotFoundException("ClubOld not found");
    }
    return result;
  }

  /**
   * @param clubId 동아리 id
   * @returns 해당 동아리가 등록했던 학기들의 정보를 리턴합니다.
   * 동아리가 등록했던 학기의 구분은 ClubT 테이블을 기준으로 합니다.
   * TODO: History 로 넘어가야 합니다.
   */
  async selectSemestersByClubId(param: { clubId: number }) {
    const result = await this.prisma.$queryRaw<
      Array<{
        id: number;
        year: number;
        name: string;
        startTerm: Date;
        endTerm: Date;
        createdAt: Date | null;
        deletedAt: Date | null;
      }>
    >(Prisma.sql`
      SELECT sd.id, sd.year, sd.name,
             sd.start_term AS startTerm,
             sd.end_term AS endTerm,
             sd.created_at AS createdAt,
             sd.deleted_at AS deletedAt
      FROM semester_d sd
      INNER JOIN club_t ct ON sd.id = ct.semester_id
      WHERE ct.club_id = ${param.clubId} AND ct.deleted_at IS NULL
    `);
    return result;
  }
}
