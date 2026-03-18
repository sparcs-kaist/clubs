import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { IProfessor } from "@clubs/interface/api/user/type/user.type";

import logger from "@sparcs-clubs/api/common/util/logger";
import { takeOne } from "@sparcs-clubs/api/common/util/util";
import { PrismaService } from "@sparcs-clubs/api/prisma/prisma.service";

@Injectable()
export default class OldProfessorRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getProfessorPhoneNumber(id: number) {
    const result = await this.prisma.$queryRaw<
      Array<{ phoneNumber: string | null }>
    >(Prisma.sql`
      SELECT u.phone_number AS phoneNumber
      FROM professor p
      LEFT JOIN user u ON u.id = p.user_id
      LEFT JOIN professor_t pt ON pt.professor_id = p.id
        AND (pt.end_term >= NOW() OR pt.end_term IS NULL)
        AND pt.start_term <= NOW()
        AND pt.deleted_at IS NULL
      WHERE p.user_id = ${id} AND p.deleted_at IS NULL
      LIMIT 1
    `);
    return takeOne(result);
  }

  async selectProfessorById(id: number) {
    return this.prisma.professor.findMany({
      where: { userId: id, deletedAt: null },
    });
  }

  async updateProfessorPhoneNumber(id: number, phoneNumber: string) {
    const isUpdateSucceed = await this.prisma.$transaction(async tx => {
      const result = await tx.user.updateMany({
        where: { id, deletedAt: null },
        data: { phoneNumber },
      });
      if (result.count === 0) {
        logger.debug("[updatePhoneNumber] rollback occurs");
        throw new Error("updatePhoneNumber failed");
      }
      return true;
    });
    return isUpdateSucceed;
  }

  async findAll(ids: number[]): Promise<IProfessor[]> {
    if (ids.length === 0) {
      return [];
    }

    const professors = await this.prisma.$queryRaw<IProfessor[]>(Prisma.sql`
      SELECT p.id, p.name, p.user_id AS userId, p.email,
             pt.professor_enum AS professorEnum,
             pt.department,
             u.phone_number AS phoneNumber
      FROM professor p
      LEFT JOIN user u ON u.id = p.user_id
      LEFT JOIN professor_t pt ON pt.professor_id = p.id
      WHERE p.id IN (${Prisma.join(ids)})
    `);
    return professors;
  }

  async find(id: number): Promise<IProfessor> {
    const result = await this.prisma.$queryRaw<IProfessor[]>(Prisma.sql`
      SELECT p.id, p.name, p.user_id AS userId, p.email,
             pt.professor_enum AS professorEnum,
             pt.department,
             u.phone_number AS phoneNumber
      FROM professor p
      LEFT JOIN user u ON u.id = p.user_id
      LEFT JOIN professor_t pt ON pt.professor_id = p.id
      WHERE p.id = ${id} AND p.deleted_at IS NULL
    `);

    if (result.length !== 1) {
      return null;
    }

    return result[0];
  }
}
