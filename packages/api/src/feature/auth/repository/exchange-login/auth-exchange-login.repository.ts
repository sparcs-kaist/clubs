import { Injectable } from "@nestjs/common";
import { TransactionHost } from "@nestjs-cls/transactional";

import { PrismaTransactionalAdapter } from "@sparcs-clubs/api/common/transaction/transaction.type";

export interface ExchangeLoginLogInput {
  actorUserId: number;
  actorEmail: string | null;
  targetUserId: number;
  targetEmail: string | null;
  originalActorUserId: number;
  originalActorEmail: string | null;
}

@Injectable()
export class AuthExchangeLoginRepository {
  constructor(
    private readonly txHost: TransactionHost<PrismaTransactionalAdapter>,
  ) {}

  async storeRefreshToken(data: {
    userId: number;
    refreshToken: string;
    expiresAt: Date;
  }): Promise<void> {
    await this.txHost.tx.authActivatedRefreshTokens.create({ data });
  }

  async deleteRefreshToken(
    userId: number,
    refreshToken: string,
    queriedAt: Date,
  ): Promise<void> {
    const result = await this.txHost.tx.authActivatedRefreshTokens.deleteMany({
      where: { userId, refreshToken, expiresAt: { gte: queriedAt } },
    });
    if (result.count !== 1) {
      throw new Error("deleteRefreshTokenRecord failed");
    }
  }

  async createExchangeLog(data: ExchangeLoginLogInput): Promise<void> {
    await this.txHost.tx.authExchangeLoginLog.create({ data });
  }
}
