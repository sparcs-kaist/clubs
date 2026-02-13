import { Injectable } from "@nestjs/common";

import { IntentionalRollback } from "@sparcs-clubs/api/common/util/exception.filter";
import { PrismaService } from "@sparcs-clubs/api/prisma/prisma.service";

@Injectable()
export class FundingDeadlineSqlRepository {
  constructor(private readonly prisma: PrismaService) {}

  async checkExistingFundingDeadline(
    semesterId: number,
    startTerm: Date,
    endTerm: Date,
  ): Promise<boolean> {
    const existingDeadlines = await this.prisma.fundingDeadlineD.findMany({
      where: {
        semesterId,
        deletedAt: null,
        OR: [
          {
            AND: [{ endTerm: { gt: startTerm } }, { endTerm: { lt: endTerm } }],
          },
          {
            AND: [
              { startTerm: { gt: startTerm } },
              { startTerm: { lt: endTerm } },
            ],
          },
          { startTerm: { equals: startTerm } },
          { endTerm: { equals: endTerm } },
          {
            AND: [{ startTerm: { lt: endTerm } }, { endTerm: { gt: endTerm } }],
          },
          {
            AND: [
              { startTerm: { gt: startTerm } },
              { endTerm: { lt: startTerm } },
            ],
          },
        ],
      },
    });

    return existingDeadlines.length > 0;
  }

  async createFundingDeadline(
    startTerm: Date,
    endTerm: Date,
    deadlineEnum: number,
    semesterId: number,
  ): Promise<boolean> {
    try {
      await this.prisma.$transaction(async tx => {
        const result = await tx.fundingDeadlineD.create({
          data: {
            startTerm,
            endTerm,
            deadlineEnum,
            semesterId,
          },
        });
        if (!result) {
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

  async getFundingDeadlines(semesterId: number) {
    // Prisma middleware handles timezone conversion automatically
    const fundingDeadlines = await this.prisma.fundingDeadlineD.findMany({
      where: {
        semesterId,
        deletedAt: null,
      },
    });
    return fundingDeadlines;
  }

  async deleteFundingDeadline(deadlineId: number): Promise<boolean> {
    const cur = new Date();
    try {
      await this.prisma.$transaction(async tx => {
        const result = await tx.fundingDeadlineD.updateMany({
          where: {
            id: deadlineId,
            deletedAt: null,
          },
          data: { deletedAt: cur },
        });
        if (result.count === 0) {
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
