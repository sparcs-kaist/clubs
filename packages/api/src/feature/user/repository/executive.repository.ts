import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { IntentionalRollback } from "@sparcs-clubs/api/common/util/exception.filter";
import logger from "@sparcs-clubs/api/common/util/logger";
import { takeOne } from "@sparcs-clubs/api/common/util/util";
import { PrismaService } from "@sparcs-clubs/api/prisma/prisma.service";

import { VExecutiveSummary } from "../model/executive.summary.model";

const buildExecutiveTermOverlapWhere = (
  startTerm: Date,
  endTerm: Date | null,
  excludeExecutiveTId?: number,
): Prisma.ExecutiveTWhereInput => ({
  ...(excludeExecutiveTId === undefined
    ? {}
    : {
        id: { not: excludeExecutiveTId },
      }),
  deletedAt: null,
  ...(endTerm === null
    ? {}
    : {
        startTerm: { lte: endTerm },
      }),
  OR: [{ endTerm: { gte: startTerm } }, { endTerm: null }],
});

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
    const today = new Date();
    const result = await this.prisma.executive.findFirst({
      where: {
        userId: id,
        deletedAt: null,
        executiveTs: {
          some: buildExecutiveTermOverlapWhere(today, today),
        },
      },
      select: { id: true },
    });
    return result !== null;
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
    startTerm: Date,
    endTerm: Date | null,
    excludeExecutiveTId?: number,
  ) {
    const result = await this.prisma.executive.findFirst({
      where: {
        studentId,
        deletedAt: null,
        executiveTs: {
          some: buildExecutiveTermOverlapWhere(
            startTerm,
            endTerm,
            excludeExecutiveTId,
          ),
        },
      },
      select: { id: true },
    });
    return result !== null;
  }

  async createExecutive(
    studentId: number,
    userId: number | null,
    email: string | null,
    name: string,
    startTerm: Date,
    endTerm: Date | null,
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

        await tx.executiveT.create({
          data: {
            executiveId,
            executiveStatusEnum: 1,
            executiveBureauEnum: 1,
            startTerm,
            endTerm,
          },
        });

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
    const today = new Date();
    const result = await this.prisma.executiveT.findMany({
      where: {
        ...buildExecutiveTermOverlapWhere(today, today),
        executive: {
          deletedAt: null,
          user: {
            is: {
              deletedAt: null,
            },
          },
          student: {
            deletedAt: null,
          },
        },
      },
      select: {
        id: true,
        startTerm: true,
        endTerm: true,
        executive: {
          select: {
            id: true,
            userId: true,
            name: true,
            email: true,
            user: {
              select: {
                name: true,
                email: true,
                phoneNumber: true,
              },
            },
            student: {
              select: {
                number: true,
              },
            },
          },
        },
      },
    });
    return result.map(executiveTerm => ({
      id: executiveTerm.executive.id,
      executiveTId: executiveTerm.id,
      userId: executiveTerm.executive.userId,
      studentNumber: String(executiveTerm.executive.student.number),
      name: executiveTerm.executive.user?.name ?? executiveTerm.executive.name,
      email:
        executiveTerm.executive.user?.email ?? executiveTerm.executive.email,
      phoneNumber: executiveTerm.executive.user?.phoneNumber ?? null,
      startTerm: executiveTerm.startTerm,
      endTerm: executiveTerm.endTerm,
    }));
  }

  async selectExecutiveTermById(executiveTId: number) {
    return this.prisma.executiveT.findFirst({
      where: {
        id: executiveTId,
        deletedAt: null,
        executive: {
          deletedAt: null,
        },
      },
      select: {
        id: true,
        executive: {
          select: {
            studentId: true,
          },
        },
      },
    });
  }

  async updateExecutiveTerm(
    executiveTId: number,
    startTerm: Date,
    endTerm: Date | null,
  ) {
    const result = await this.prisma.executiveT.updateMany({
      where: { id: executiveTId, deletedAt: null },
      data: {
        startTerm,
        endTerm,
      },
    });
    return result.count > 0;
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
