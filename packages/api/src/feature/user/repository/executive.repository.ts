import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { IntentionalRollback } from "@sparcs-clubs/api/common/util/exception.filter";
import logger from "@sparcs-clubs/api/common/util/logger";
import { takeOne } from "@sparcs-clubs/api/common/util/util";
import { PrismaService } from "@sparcs-clubs/api/prisma/prisma.service";

import { VExecutiveSummary } from "../model/executive.summary.model";

@Injectable()
export default class ExecutiveRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findExecutiveById(id: number): Promise<boolean> {
    const result = await this.prisma.$queryRaw<Array<{ id: number }>>(
      Prisma.sql`
        SELECT et.id
        FROM executive_t et
        WHERE et.executive_id = ${id}
          AND (DATE(et.end_term) >= DATE(NOW()) OR et.end_term IS NULL)
          AND DATE(et.start_term) <= DATE(NOW())
      `,
    );
    return result.length > 0;
  }

  async findExecutiveByUserId(id: number): Promise<boolean> {
    const result = await this.prisma.$queryRaw<Array<{ id: number }>>(
      Prisma.sql`
        SELECT e.id
        FROM executive e
        INNER JOIN executive_t et ON et.executive_id = e.id
          AND (DATE(et.end_term) >= DATE(NOW()) OR et.end_term IS NULL)
          AND DATE(et.start_term) <= DATE(NOW())
        WHERE e.user_id = ${id}
          AND e.deleted_at IS NULL
      `,
    );
    return result.length > 0;
  }

  async getExecutiveById(id: number) {
    const crt = new Date();
    const result = await this.prisma.executiveT.findMany({
      where: {
        executiveId: id,
        startTerm: { lte: crt },
        deletedAt: null,
        OR: [{ endTerm: { gte: crt } }, { endTerm: null }],
      },
    });
    return result;
  }

  async getExecutivePhoneNumber(id: number) {
    const result = await this.prisma.$queryRaw<
      Array<{ phoneNumber: string | null }>
    >(
      Prisma.sql`
        SELECT u.phone_number AS phoneNumber
        FROM executive e
        LEFT JOIN user u ON u.id = e.user_id
        LEFT JOIN executive_t et ON et.executive_id = e.id
          AND (et.end_term >= NOW() OR et.end_term IS NULL)
          AND et.start_term <= NOW()
          AND et.deleted_at IS NULL
        WHERE e.user_id = ${id}
        LIMIT 1
      `,
    );
    return takeOne(result);
  }

  async updateExecutivePhoneNumber(id: number, phoneNumber: string) {
    const isUpdateSucceed = await this.prisma.$transaction(async tx => {
      const result = await tx.user.updateMany({
        where: { id, deletedAt: null },
        data: { phoneNumber },
      });
      if (result.count === 0) {
        logger.debug("[updateExecutivePhoneNumber] rollback occurs");
        throw new Error("updateExecutivePhoneNumber failed");
      }
      return true;
    });
    return isUpdateSucceed;
  }

  async selectExecutiveById(param: { id: number }) {
    const result = await this.prisma.executive.findMany({
      where: { id: param.id, deletedAt: null },
    });
    return result;
  }

  async selectExecutiveByDate(param: { date: Date }) {
    const result = await this.prisma.$queryRaw<
      Array<{
        executive_t: {
          id: number;
          executive_id: number;
          executive_status_enum: number;
          executive_bureau_enum: number;
          start_term: Date;
          end_term: Date | null;
          created_at: Date | null;
          deleted_at: Date | null;
        };
        executive: {
          id: number;
          user_id: number | null;
          student_id: number;
          name: string;
          email: string | null;
          created_at: Date | null;
          deleted_at: Date | null;
        };
      }>
    >(
      Prisma.sql`
        SELECT
          et.id AS et_id, et.executive_id, et.executive_status_enum,
          et.executive_bureau_enum, et.start_term, et.end_term,
          et.created_at AS et_created_at, et.deleted_at AS et_deleted_at,
          e.id AS e_id, e.user_id, e.student_id, e.name AS e_name,
          e.email AS e_email, e.created_at AS e_created_at,
          e.deleted_at AS e_deleted_at
        FROM executive_t et
        INNER JOIN executive e ON e.id = et.executive_id
          AND e.deleted_at IS NULL
        WHERE et.start_term <= ${param.date}
          AND (et.end_term >= ${param.date} OR et.end_term IS NULL)
          AND et.deleted_at IS NULL
      `,
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return result.map((row: any) => ({
      executive_t: {
        id: row.et_id,
        executiveId: row.executive_id,
        executiveStatusEnum: row.executive_status_enum,
        executiveBureauEnum: row.executive_bureau_enum,
        startTerm: row.start_term,
        endTerm: row.end_term,
        createdAt: row.et_created_at,
        deletedAt: row.et_deleted_at,
      },
      executive: {
        id: row.e_id,
        userId: row.user_id,
        studentId: row.student_id,
        name: row.e_name,
        email: row.e_email,
        createdAt: row.e_created_at,
        deletedAt: row.e_deleted_at,
      },
    }));
  }

  async fetchExecutiveSummaries(date: Date): Promise<VExecutiveSummary[]> {
    const result = await this.prisma.$queryRaw<
      Array<{
        e_id: number;
        e_name: string;
        user_id: number;
        number: number;
      }>
    >(
      Prisma.sql`
        SELECT e.id AS e_id, e.name AS e_name, e.user_id, s.number
        FROM executive_t et
        INNER JOIN executive e ON e.id = et.executive_id
          AND e.deleted_at IS NULL
        INNER JOIN student s ON s.user_id = e.user_id
          AND s.deleted_at IS NULL
        WHERE et.start_term <= ${date}
          AND (et.end_term >= ${date} OR et.end_term IS NULL)
          AND et.deleted_at IS NULL
      `,
    );
    return result.map(row =>
      VExecutiveSummary.fromDBResult({
        executive: {
          id: row.e_id,
          name: row.e_name,
          userId: row.user_id,
        },
        student: {
          number: row.number,
        },
      }),
    );
  }

  async fetchSummaries(executiveIds: number[]): Promise<VExecutiveSummary[]> {
    if (executiveIds.length === 0) {
      return [];
    }

    const result = await this.prisma.$queryRaw<
      Array<{
        e_id: number;
        e_name: string;
        user_id: number;
        number: number;
      }>
    >(
      Prisma.sql`
        SELECT e.id AS e_id, e.name AS e_name, e.user_id, s.number
        FROM executive e
        INNER JOIN student s ON s.user_id = e.user_id
          AND s.deleted_at IS NULL
        WHERE e.id IN (${Prisma.join(executiveIds)})
          AND e.deleted_at IS NULL
      `,
    );

    return result.map(row =>
      VExecutiveSummary.fromDBResult({
        executive: {
          id: row.e_id,
          name: row.e_name,
          userId: row.user_id,
        },
        student: {
          number: row.number,
        },
      }),
    );
  }

  async fetchSummary(id: number): Promise<VExecutiveSummary> {
    const result = await this.findSummary(id);
    if (!result) {
      throw new NotFoundException("Executive not found");
    }
    return result;
  }

  async findSummary(id: number): Promise<VExecutiveSummary | null> {
    const result = await this.prisma.$queryRaw<
      Array<{
        e_id: number;
        e_name: string;
        user_id: number;
        number: number;
      }>
    >(
      Prisma.sql`
        SELECT e.id AS e_id, e.name AS e_name, e.user_id, s.number
        FROM executive e
        INNER JOIN student s ON s.user_id = e.user_id
          AND s.deleted_at IS NULL
        WHERE e.id = ${id}
          AND e.deleted_at IS NULL
        LIMIT 1
      `,
    );

    const row = takeOne(result);
    return row
      ? VExecutiveSummary.fromDBResult({
          executive: {
            id: row.e_id,
            name: row.e_name,
            userId: row.user_id,
          },
          student: {
            number: row.number,
          },
        })
      : null;
  }

  async checkExistExecutiveByIdDate(
    studentId: number,
    startTerm: string,
    endTerm: string,
  ) {
    const result = await this.prisma.$queryRaw<Array<{ id: number }>>(
      Prisma.sql`
        SELECT e.id
        FROM executive e
        INNER JOIN executive_t et ON et.executive_id = e.id
          AND et.deleted_at IS NULL
          AND (
            (
              et.end_term IS NOT NULL
              AND (
                (DATE(et.start_term) >= ${startTerm} AND DATE(et.start_term) <= ${endTerm})
                OR (DATE(et.end_term) >= ${startTerm} AND DATE(et.end_term) <= ${endTerm})
                OR (DATE(et.start_term) <= ${startTerm} AND DATE(et.end_term) >= ${endTerm})
              )
            )
            OR (
              et.end_term IS NULL
              AND (
                (DATE(et.start_term) >= ${startTerm} AND DATE(et.start_term) <= ${endTerm})
                OR DATE(et.start_term) <= ${startTerm}
              )
            )
          )
        WHERE e.student_id = ${studentId}
          AND e.deleted_at IS NULL
      `,
    );
    return result.length > 0;
  }

  async createExecutive(
    studentId: number,
    userId: number,
    email: string,
    name: string,
    startTerm: string,
    endTerm: string,
  ) {
    try {
      await this.prisma.$transaction(async tx => {
        let executiveId: number;

        const existingExecutives = await tx.executive.findMany({
          where: { studentId },
          select: { id: true, deletedAt: true },
        });

        if (existingExecutives.length > 0) {
          if (existingExecutives[0].deletedAt) {
            await tx.executive.update({
              where: { id: existingExecutives[0].id },
              data: { deletedAt: null },
            });
          }
          executiveId = existingExecutives[0].id;
        } else {
          const newExecutive = await tx.executive.create({
            data: { userId, studentId, email, name },
          });
          executiveId = newExecutive.id;
        }

        await tx.$executeRaw(Prisma.sql`
          INSERT INTO executive_t (executive_id, executive_status_enum, executive_bureau_enum, start_term, end_term)
          VALUES (${executiveId}, 1, 1, DATE(${startTerm}), DATE(${endTerm}))
        `);

        return true;
      });

      return true;
    } catch (error) {
      if (error instanceof IntentionalRollback) {
        return false;
      }
      throw error;
    }
  }

  async getExecutives() {
    const result = await this.prisma.$queryRaw<
      Array<{
        id: number;
        userId: number | null;
        studentNumber: number;
        name: string;
        email: string | null;
        phoneNumber: string | null;
        startTerm: Date;
        endTerm: Date | null;
      }>
    >(
      Prisma.sql`
        SELECT e.id, e.user_id AS userId, s.number AS studentNumber,
               u.name, u.email, u.phone_number AS phoneNumber,
               et.start_term AS startTerm, et.end_term AS endTerm
        FROM executive e
        INNER JOIN executive_t et ON et.executive_id = e.id
          AND (DATE(et.end_term) >= DATE(NOW()) OR et.end_term IS NULL)
          AND DATE(et.start_term) <= DATE(NOW())
          AND et.deleted_at IS NULL
        INNER JOIN user u ON u.id = e.user_id
          AND u.deleted_at IS NULL
        INNER JOIN student s ON s.id = e.student_id
          AND s.deleted_at IS NULL
        WHERE e.deleted_at IS NULL
      `,
    );
    return result;
  }

  async deleteExecutiveById(executiveId: number) {
    const cur = new Date();
    try {
      await this.prisma.$transaction(async tx => {
        const executiveUpdate = await tx.executive.updateMany({
          where: { id: executiveId, deletedAt: null },
          data: { deletedAt: cur },
        });
        const executiveTUpdate = await tx.executiveT.updateMany({
          where: { executiveId, deletedAt: null },
          data: { deletedAt: cur },
        });
        if (executiveUpdate.count === 0 || executiveTUpdate.count === 0) {
          throw new IntentionalRollback();
        }
        return true;
      });
      return true;
    } catch (error) {
      if (error instanceof IntentionalRollback) {
        return false;
      }
      throw error;
    }
  }
}
