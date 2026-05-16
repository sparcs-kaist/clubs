import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import logger from "@sparcs-clubs/api/common/util/logger";
import { takeOne } from "@sparcs-clubs/api/common/util/util";
import { PrismaService } from "@sparcs-clubs/api/prisma/prisma.service";

@Injectable()
export default class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findStudentById(studentId: number) {
    const user = await this.prisma.$queryRaw<
      Array<{
        id: number;
        name: string;
        email: string | null;
        department: string | null;
        studentNumber: number;
        phoneNumber: string | null;
      }>
    >(Prisma.sql`
      SELECT s.id, s.name, s.email, d.name AS department,
             s.number AS studentNumber, u.phone_number AS phoneNumber
      FROM student s
      LEFT JOIN user u ON u.id = s.user_id
      LEFT JOIN student_t st ON st.student_id = s.id
        AND st.start_term <= NOW()
        AND (st.end_term >= NOW() OR st.end_term IS NULL)
      LEFT JOIN department d ON d.id = st.department
      WHERE s.id = ${studentId}
    `);
    return user;
  }

  async findStudentByStudentNumberNameDate(
    studentNumber: string,
    name: string,
    startTerm: Date,
    endTerm: Date | null,
  ) {
    const studentnumber = Number.parseInt(studentNumber);
    if (Number.isNaN(studentnumber)) {
      return [];
    }

    const targetEndTerm = endTerm ?? startTerm;
    const users = await this.prisma.student.findMany({
      where: {
        number: studentnumber,
        name,
        deletedAt: null,
        studentTs: {
          some: {
            deletedAt: null,
            startTerm: { lte: startTerm },
            OR: [{ endTerm: { gte: targetEndTerm } }, { endTerm: null }],
          },
        },
      },
      select: {
        id: true,
        userId: true,
        email: true,
      },
    });
    return users.map(user => ({
      student: {
        id: user.id,
        userId: user.userId,
        email: user.email,
      },
    }));
  }

  async findStudentByStudentNumber(studentNumber: string) {
    const studentnumber = Number.parseInt(studentNumber);
    if (Number.isNaN(studentnumber)) {
      return null;
    }

    return this.prisma.student.findFirst({
      where: {
        number: studentnumber,
        deletedAt: null,
      },
      select: {
        id: true,
        userId: true,
        email: true,
        name: true,
      },
    });
  }

  async create(studentId: number) {
    const user = await this.prisma.$queryRaw(Prisma.sql`
      SELECT s.*, u.*
      FROM student s
      LEFT JOIN user u ON u.id = s.user_id
      WHERE s.id = ${studentId}
    `);
    return user;
  }

  async findUserNameById(userId: number) {
    const userName = await this.prisma.user.findMany({
      where: { id: userId },
      select: { name: true },
    });
    return userName;
  }

  async getPhoneNumber(userId: number) {
    const result = await this.prisma.user.findMany({
      where: { id: userId, deletedAt: null },
      select: { phoneNumber: true },
    });
    return takeOne(result);
  }

  async updatePhoneNumber(userId: number, phoneNumber: string) {
    const isUpdateSucceed = await this.prisma.$transaction(async tx => {
      const result = await tx.user.updateMany({
        where: { id: userId, deletedAt: null },
        data: { phoneNumber },
      });
      if (result.count !== 1) {
        logger.debug("[updatePhoneNumber] rollback occurs");
        throw new Error("updatePhoneNumber failed");
      }
      return true;
    });
    return isUpdateSucceed;
  }
}
