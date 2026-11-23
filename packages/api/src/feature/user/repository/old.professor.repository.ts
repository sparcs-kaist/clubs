import { Injectable } from "@nestjs/common";
import { TransactionHost } from "@nestjs-cls/transactional";
import { Prisma } from "@prisma/client";

import { IProfessor } from "@clubs/interface/api/user/type/user.type";

import { PrismaTransactionalAdapter } from "@sparcs-clubs/api/common/transaction/transaction.type";
import { PrismaService } from "@sparcs-clubs/api/prisma/prisma.service";

@Injectable()
export default class OldProfessorRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly txHost: TransactionHost<PrismaTransactionalAdapter>,
  ) {}

  async saveRegistrationAdvisor(
    { name, email }: { name: string; email: string },
    startTerm: Date,
  ): Promise<number> {
    const { tx } = this.txHost;
    await tx.professor.createMany({
      data: [{ name, email }],
      skipDuplicates: true,
    });
    const professor = await tx.professor.update({
      where: { email, deletedAt: null },
      data: { name },
      select: { id: true },
    });
    await tx.professorT.createMany({
      data: [{ professorId: professor.id, startTerm }],
      skipDuplicates: true,
    });
    return professor.id;
  }

  async selectProfessorById(id: number) {
    return this.prisma.professor.findMany({
      where: { userId: id, deletedAt: null },
    });
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
