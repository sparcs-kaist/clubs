import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import logger from "@sparcs-clubs/api/common/util/logger";
import { takeOne } from "@sparcs-clubs/api/common/util/util";
import { PrismaService } from "@sparcs-clubs/api/prisma/prisma.service";

@Injectable()
export default class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findStudentById(studentId: number) {
    const crt = new Date();
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
        AND st.start_term <= ${crt}
        AND (st.end_term >= ${crt} OR st.end_term IS NULL)
      LEFT JOIN department d ON d.id = st.department
      WHERE s.id = ${studentId}
    `);
    return user;
  }

  async findStudentByStudentNumberNameDate(
    studentNumber: string,
    name: string,
    startTerm: string,
    endTerm: string,
  ) {
    const studentnumber = parseInt(studentNumber);
    const user = await this.prisma.$queryRaw(Prisma.sql`
      SELECT s.*, st.*
      FROM student s
      INNER JOIN student_t st ON st.student_id = s.id
        AND DATE(st.start_term) <= ${startTerm}
        AND (DATE(st.end_term) >= ${endTerm} OR st.end_term IS NULL)
      WHERE s.number = ${studentnumber}
        AND s.name = ${name}
        AND s.deleted_at IS NULL
    `);
    return user;
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
