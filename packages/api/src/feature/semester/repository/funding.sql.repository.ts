import { Inject, Injectable } from "@nestjs/common";
import { TransactionHost } from "@nestjs-cls/transactional";

import { CLOCK, Clock } from "@sparcs-clubs/api/common/clock/clock";
import { PrismaTransactionalAdapter } from "@sparcs-clubs/api/common/transaction/transaction.type";

@Injectable()
export class FundingDeadlineSqlRepository {
  @Inject(CLOCK) private readonly clock: Clock;

  constructor(
    private readonly txHost: TransactionHost<PrismaTransactionalAdapter>,
  ) {}

  async checkExistingFundingDeadline(
    semesterId: number,
    startTerm: Date,
    endTerm: Date,
  ): Promise<boolean> {
    const existingDeadline = await this.txHost.tx.fundingDeadlineD.findFirst({
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
      select: { id: true },
    });

    return existingDeadline != null;
  }

  async createFundingDeadline(
    startTerm: Date,
    endTerm: Date,
    deadlineEnum: number,
    semesterId: number,
  ): Promise<boolean> {
    const result = await this.txHost.tx.fundingDeadlineD.create({
      data: {
        startTerm,
        endTerm,
        deadlineEnum,
        semesterId,
      },
    });

    return result != null;
  }

  async getFundingDeadlines(semesterId: number) {
    // Prisma middleware handles timezone conversion automatically
    const fundingDeadlines = await this.txHost.tx.fundingDeadlineD.findMany({
      where: {
        semesterId,
        deletedAt: null,
      },
    });
    return fundingDeadlines;
  }

  async deleteFundingDeadline(deadlineId: number): Promise<boolean> {
    const cur = this.clock.now();
    const result = await this.txHost.tx.fundingDeadlineD.updateMany({
      where: {
        id: deadlineId,
        deletedAt: null,
      },
      data: { deletedAt: cur },
    });

    return result.count > 0;
  }
}
