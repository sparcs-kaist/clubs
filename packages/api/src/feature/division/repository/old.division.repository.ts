import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { IDivisionSummary } from "@clubs/interface/api/club/type/club.type";
import { IDivision } from "@clubs/interface/api/division/type/division.type";

import { PrismaTransactionClient } from "@sparcs-clubs/api/common/base/base.repository";
import { PrismaService } from "@sparcs-clubs/api/prisma/prisma.service";

import { OldMDivision } from "../model/old.division.model";

@Injectable()
export default class OldDivisionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async withTransaction<Result>(
    callback: (tx: PrismaTransactionClient) => Promise<Result>,
  ): Promise<Result> {
    return this.prisma.$transaction(callback);
  }

  async selectDivisionsAndDivisionPresidents() {
    const rows = await this.prisma.$queryRaw<
      Array<{
        divisionId: number;
        divisionName: string;
        presidentStudentId: number;
      }>
    >(Prisma.sql`
      SELECT d.id AS divisionId, d.name AS divisionName, dp.student_id AS presidentStudentId
      FROM division d
      INNER JOIN division_president_d dp
        ON d.deleted_at IS NULL
        AND dp.deleted_at IS NULL
        AND d.id = dp.division_id
        AND dp.start_term <= NOW()
        AND dp.end_term >= NOW()
    `);
    return rows.map(row => ({
      division: { id: row.divisionId, name: row.divisionName },
      division_president_d: { studentId: row.presidentStudentId },
    }));
  }

  async findDivisionById(divisionId: number): Promise<number | undefined> {
    const result = await this.prisma.division.findFirst({
      where: { id: divisionId, deletedAt: null },
      select: { id: true },
    });
    return result ? result.id : undefined;
  }

  async selectDivisionById(param: { id: number }) {
    const result = await this.prisma.division.findMany({
      where: { id: param.id, deletedAt: null },
    });
    return result;
  }

  async fetchSummaries(ids: number[]): Promise<IDivisionSummary[]> {
    if (ids.length === 0) {
      return [];
    }

    const result = await this.prisma.division.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true },
    });
    return result;
  }

  async fetchSummary(id: number): Promise<IDivisionSummary> {
    const result = await this.prisma.division.findMany({
      where: { id, deletedAt: null },
      select: { id: true, name: true },
    });

    if (result.length !== 1) {
      throw new NotFoundException("Division not found");
    }

    return result[0];
  }

  async fetchAllTx(
    tx: PrismaTransactionClient,
    arg1: Date | number[],
  ): Promise<IDivision[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereCondition: any = { deletedAt: null };

    if (arg1 instanceof Date) {
      whereCondition.startTerm = { lte: arg1 };
      whereCondition.OR = [{ endTerm: { gte: arg1 } }, { endTerm: null }];
    }

    if (arg1 instanceof Array) {
      whereCondition.id = { in: arg1 };
    }

    const result = await (tx as PrismaService).division.findMany({
      where: whereCondition,
    });

    // fetch validation part
    if (arg1 instanceof Date) {
      if (result.length === 0) {
        throw new NotFoundException("Division not found");
      }
    }

    if (arg1 instanceof Array) {
      if (result.length !== Array.from(new Set(arg1)).length) {
        throw new NotFoundException("Division not found");
      }
    }
    return result.map(e => OldMDivision.from(e));
  }

  async fetchAll(date: Date): Promise<IDivision[]>;
  async fetchAll(ids: IDivision["id"][]): Promise<IDivision[]>;
  async fetchAll(arg1: Date | number[]): Promise<IDivision[]> {
    return this.withTransaction(tx => this.fetchAllTx(tx, arg1));
  }
}
