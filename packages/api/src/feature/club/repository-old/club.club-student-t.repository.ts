import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import logger from "@sparcs-clubs/api/common/util/logger";
import { takeOne } from "@sparcs-clubs/api/common/util/util";
import { MOldStudent } from "@sparcs-clubs/api/feature/user/model/old.student.model";
import { PrismaService } from "@sparcs-clubs/api/prisma/prisma.service";

@Injectable()
export default class ClubStudentTRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByClubIdAndSemesterId(clubId: number, semesterId: number) {
    const result = await this.prisma.clubStudentT.findMany({
      where: {
        clubId,
        semesterId,
        deletedAt: null,
      },
    });

    return result;
  }

  async findTotalMemberCnt(
    clubId: number,
    semesterId: number,
  ): Promise<number> {
    const today = new Date();

    if (semesterId) {
      return this.prisma.clubStudentT.count({
        where: { clubId, semesterId, deletedAt: null },
      });
    }

    return this.prisma.clubStudentT.count({
      where: {
        clubId,
        startTerm: { lte: today },
        OR: [{ endTerm: { gte: today } }, { endTerm: null }],
        deletedAt: null,
      },
    });
  }

  async findStudentSemester(studentId: number) {
    const result = await this.prisma.$queryRaw<
      Array<{
        id: number;
        name: string;
        year: number;
        startTerm: Date;
        endTerm: Date;
        clubId: number;
      }>
    >(Prisma.sql`
      SELECT sd.id, sd.name, sd.year, sd.start_term AS startTerm,
             sd.end_term AS endTerm, cst.club_id AS clubId
      FROM club_student_t cst
      LEFT JOIN semester_d sd ON sd.id = cst.semester_id
      WHERE cst.student_id = ${studentId}
        AND cst.deleted_at IS NULL
      ORDER BY sd.id DESC
    `);
    return result.map(row => ({
      id: row.id,
      name: `${row.year} ${row.name}`,
      startTerm: row.startTerm,
      endTerm: row.endTerm,
      clubs: [{ id: row.clubId }],
    }));
  }

  async findClubStudentByClubIdAndStudentId(
    clubId: number,
    studentId: number,
  ): Promise<{
    club_student_id: number;
    student_id: number;
    club_id: number;
    name: string;
    phoneNumber: string;
    email: string;
  }> {
    const result = await this.prisma.$queryRaw<
      Array<{
        club_student_id: number;
        student_id: number;
        club_id: number;
        name: string;
        phoneNumber: string;
        email: string;
      }>
    >(Prisma.sql`
      SELECT cst.id AS club_student_id, s.id AS student_id,
             cst.club_id AS club_id, s.name,
             u.phone_number AS phoneNumber, s.email
      FROM club_student_t cst
      LEFT JOIN student s ON s.id = ${studentId}
      LEFT JOIN user u ON u.id = s.user_id
      WHERE cst.club_id = ${clubId} AND cst.student_id = ${studentId}
      LIMIT 1
    `);
    return takeOne(result);
  }

  async getClubsByStudentId(studentId: number) {
    const clubs = await this.prisma.$queryRaw<
      Array<{
        id: number;
        nameKr: string | null;
        nameEn: string | null;
      }>
    >(Prisma.sql`
      SELECT cst.club_id AS id, c.name_kr AS nameKr, c.name_en AS nameEn
      FROM club_student_t cst
      LEFT JOIN club c ON c.id = cst.club_id
      WHERE cst.student_id = ${studentId}
        AND cst.start_term <= NOW()
        AND (cst.end_term >= NOW() OR cst.end_term IS NULL)
    `);
    return clubs;
  }

  async addStudentToClub(
    studentId: number,
    clubId: number,
    semesterId: number,
    startTerm: Date,
    endTerm: Date,
  ): Promise<void> {
    await this.prisma.clubStudentT.create({
      data: {
        studentId,
        clubId,
        semesterId,
        startTerm,
        endTerm,
      },
    });
  }

  // ** 주의: delegate 또는 일반 부원을 제거합니다.
  // ** 제거 시 hard deletion이 이루어집니다.
  async removeStudentFromClub(
    studentId: number,
    clubId: number,
    semesterId: number,
    isTargetStudentDelegate: boolean,
  ): Promise<void> {
    if (isTargetStudentDelegate)
      await this.prisma.clubDelegateD.deleteMany({
        where: {
          studentId,
          clubId,
          deletedAt: null,
        },
      });
    await this.prisma.clubStudentT.deleteMany({
      where: {
        studentId,
        clubId,
        semesterId,
        deletedAt: null,
      },
    });
  }

  /**
   * @param param
   * @returns 어떤 동아리에 해당 기간동안 활동한 학생 목록을 가져옵니다.
   * @description 동아리 회원이 변경되는 기간이 매우 한정적이기에 동시성을 지원하지 않습니다.
   */
  async selectStudentByClubIdAndDuration(param: {
    clubId: number;
    duration: {
      startTerm: Date;
      endTerm: Date;
    };
  }) {
    const startTermDate = new Date(param.duration.startTerm);
    const endTermDate = new Date(param.duration.endTerm);

    // Find student IDs within the duration (overlap logic)
    const clubStudents = await this.prisma.clubStudentT.findMany({
      where: {
        clubId: param.clubId,
        deletedAt: null,
        NOT: {
          OR: [
            { startTerm: { gt: endTermDate } },
            {
              AND: [
                { endTerm: { not: null } },
                { endTerm: { lt: startTermDate } },
              ],
            },
          ],
        },
      },
      select: { studentId: true },
    });

    const studentIds = clubStudents.map(row => row.studentId);
    logger.debug(studentIds);

    if (studentIds.length === 0) return [];
    const result = await this.prisma.student.findMany({
      where: {
        id: { in: studentIds },
        deletedAt: null,
      },
    });

    return result;
  }

  /** NOTE: (@dora)
   * 말 그대로 semesterId 기준, 즉 해당 학기에 활동을 했느냐 기준으로 회원 목록을 반환하는 것이므로
   * 해당 학기의 활동 기간을 다 채우지 못한 회원에 대해서 (예를 들어 중간 탈퇴) 고려하고 있지 않음.
   * 만약 이런 회원들에 대한 처리가 필요해지면 endTerm을 고려하여 로직 수정 필요
   */
  async selectMemberByClubIdAndSemesterId(clubId: number, semesterId: number) {
    const result = await this.prisma.$queryRaw<
      Array<{
        name: string;
        studentId: number;
        studentNumber: number;
        email: string | null;
        phoneNumber: string | null;
      }>
    >(Prisma.sql`
      SELECT s.name, s.id AS studentId, s.number AS studentNumber,
             s.email, u.phone_number AS phoneNumber
      FROM club_student_t cst
      INNER JOIN student s ON s.id = cst.student_id
      LEFT JOIN user u ON u.id = s.user_id
      WHERE cst.club_id = ${clubId}
        AND cst.semester_id = ${semesterId}
        AND cst.deleted_at IS NULL
    `);
    return result;
  }

  /**
   * Semester랑 ClubIds 로 해당 동아리들을 하는 모든 Member의 IStudentSummary의 Union을 가져옵니다.
   */
  async findUnionByClubIdsAndSemesterId(
    clubIds: number[],
    semesterId: number,
  ): Promise<MOldStudent[]> {
    if (clubIds.length === 0) return [];

    const result = await this.prisma.$queryRaw<
      Array<{
        id: number;
        userId: number | null;
        name: string;
        studentNumber: number;
        email: string | null;
        phoneNumber: string | null;
      }>
    >(Prisma.sql`
      SELECT cst.student_id AS id, s.user_id AS userId,
             s.name, s.number AS studentNumber,
             s.email, u.phone_number AS phoneNumber
      FROM club_student_t cst
      INNER JOIN student s ON s.id = cst.student_id
      LEFT JOIN user u ON u.id = s.user_id
      WHERE cst.semester_id = ${semesterId}
        AND cst.club_id IN (${Prisma.join(clubIds)})
        AND cst.deleted_at IS NULL
    `);

    return result.map(
      row =>
        new MOldStudent({
          ...row,
          studentNumber: row.studentNumber.toString(),
        }),
    );
  }
}
