import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { IStudentSummary } from "@clubs/interface/api/user/type/user.type";

import logger from "@sparcs-clubs/api/common/util/logger";
import { takeOne } from "@sparcs-clubs/api/common/util/util";
import { PrismaService } from "@sparcs-clubs/api/prisma/prisma.service";

@Injectable()
export default class OldStudentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async selectStudentById(id: number) {
    const result = await this.prisma.$queryRaw<
      Array<{
        id: number;
        userId: number | null;
        number: number;
        name: string;
        email: string | null;
        createdAt: Date | null;
        deletedAt: Date | null;
        phoneNumber: string | null;
      }>
    >(Prisma.sql`
      SELECT s.id, s.user_id AS userId, s.number, s.name, s.email,
             s.created_at AS createdAt, s.deleted_at AS deletedAt,
             u.phone_number AS phoneNumber
      FROM student s
      LEFT JOIN user u ON u.id = s.user_id
      WHERE s.id = ${id} AND s.deleted_at IS NULL
    `);

    return result;
  }

  async isNotgraduateStudent(
    studentId: number,
    semesterId: number,
  ): Promise<boolean> {
    // student_t is refreshed on login, so fall back to the latest known row
    // when a valid student session predates the current semester rollover.
    const currentSemesterRecord = await this.prisma.studentT.findFirst({
      where: {
        studentId,
        semesterId,
        deletedAt: null,
      },
    });

    if (currentSemesterRecord) {
      return true;
    }

    const latestStudentRecord = await this.prisma.studentT.findFirst({
      where: {
        studentId,
        deletedAt: null,
      },
      orderBy: {
        semesterId: "desc",
      },
    });

    return latestStudentRecord !== null;
  }

  async selectStudentIdByStudentTId(studentTId: number) {
    const result = await this.prisma.studentT.findMany({
      where: { id: studentTId, deletedAt: null },
      select: { studentId: true },
    });

    return result;
  }

  async selectStudentStatusEnumIdByStudentIdSemesterId(
    studentId: number,
    semesterId: number,
  ) {
    const currentSemesterRecord = await this.prisma.studentT.findFirst({
      where: {
        studentId,
        semesterId,
        deletedAt: null,
      },
      select: { studentEnum: true },
    });

    if (currentSemesterRecord) {
      return { studentEnumId: currentSemesterRecord.studentEnum };
    }

    const latestStudentEnumMap = await this.getLatestStudentEnumMap([
      studentId,
    ]);
    const latestStudentEnum = latestStudentEnumMap.get(studentId);

    if (latestStudentEnum === undefined) {
      return undefined;
    }

    return { studentEnumId: latestStudentEnum };
  }

  async getStudentEnumsByIdsAndSemesterId(
    studentIds: number[],
    semesterId: number,
  ) {
    const uniqueStudentIds = [...new Set(studentIds)];

    if (uniqueStudentIds.length === 0) {
      return [];
    }

    const currentSemesterRecords = await this.prisma.studentT.findMany({
      where: {
        studentId: { in: uniqueStudentIds },
        semesterId,
        deletedAt: null,
      },
      select: { studentId: true, studentEnum: true },
    });

    const studentEnumMap = new Map<number, number>(
      currentSemesterRecords.map(record => [
        record.studentId,
        record.studentEnum,
      ]),
    );

    const missingStudentIds = uniqueStudentIds.filter(
      studentId => !studentEnumMap.has(studentId),
    );
    const latestStudentEnumMap =
      await this.getLatestStudentEnumMap(missingStudentIds);

    latestStudentEnumMap.forEach((studentEnumId, studentId) => {
      if (!studentEnumMap.has(studentId)) {
        studentEnumMap.set(studentId, studentEnumId);
      }
    });

    return uniqueStudentIds.flatMap(studentId => {
      const studentEnumId = studentEnumMap.get(studentId);

      if (studentEnumId === undefined) {
        return [];
      }

      return [{ id: studentId, studentEnumId }];
    });
  }

  private async getLatestStudentEnumMap(studentIds: number[]) {
    if (studentIds.length === 0) {
      return new Map<number, number>();
    }

    // student_t is refreshed on login, so the current semester row can be
    // missing right after semester rollover. Fall back to the latest known row.
    const latestRecords = await this.prisma.studentT.findMany({
      where: {
        studentId: { in: studentIds },
        deletedAt: null,
      },
      orderBy: [{ studentId: "asc" }, { semesterId: "desc" }],
      select: { studentId: true, studentEnum: true },
    });

    const latestStudentEnumMap = new Map<number, number>();

    latestRecords.forEach(record => {
      if (!latestStudentEnumMap.has(record.studentId)) {
        latestStudentEnumMap.set(record.studentId, record.studentEnum);
      }
    });

    return latestStudentEnumMap;
  }

  async getStudentPhoneNumber(id: number) {
    const result = await this.prisma.$queryRaw<
      Array<{ phoneNumber: string | null }>
    >(Prisma.sql`
      SELECT u.phone_number AS phoneNumber
      FROM student s
      LEFT JOIN user u ON u.id = s.user_id
      LEFT JOIN student_t st ON st.student_id = s.id
        AND (st.end_term >= NOW() OR st.end_term IS NULL)
        AND st.start_term <= NOW()
        AND st.deleted_at IS NULL
      WHERE s.user_id = ${id}
      LIMIT 1
    `);
    return takeOne(result);
  }

  async updateStudentPhoneNumber(userId: number, phoneNumber: string) {
    const isUpdateSucceed = await this.prisma.$transaction(async tx => {
      const result = await tx.user.updateMany({
        where: { id: userId, deletedAt: null },
        data: { phoneNumber },
      });

      if (result.count === 0) {
        logger.debug("[OldStudentRepository] Failed to update phone number");
        throw new Error("updateStudentPhoneNumber failed");
      }
      return true;
    });
    return isUpdateSucceed;
  }

  async fetchStudentSummaries(
    studentIds: number[],
  ): Promise<IStudentSummary[]> {
    if (studentIds.length === 0) {
      return [];
    }
    const students = await this.prisma.student.findMany({
      where: { id: { in: studentIds }, deletedAt: null },
    });

    return students.map(student => ({
      id: student.id,
      name: student.name,
      studentNumber: student.number.toString(),
    }));
  }
}
