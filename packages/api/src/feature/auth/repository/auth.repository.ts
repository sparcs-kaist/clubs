import { Inject, Injectable } from "@nestjs/common";
import { TransactionHost } from "@nestjs-cls/transactional";

import { CLOCK, Clock } from "@sparcs-clubs/api/common/clock/clock";
import { PrismaTransactionalAdapter } from "@sparcs-clubs/api/common/transaction/transaction.type";

@Injectable()
export class AuthRepository {
  constructor(
    private readonly txHost: TransactionHost<PrismaTransactionalAdapter>,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async hasActiveRefreshToken(
    userId: number,
    refreshToken: string,
  ): Promise<boolean> {
    const count = await this.txHost.tx.authActivatedRefreshTokens.count({
      where: { userId, refreshToken, expiresAt: { gte: this.clock.now() } },
    });
    return count > 0;
  }

  async createRefreshTokenRecord(
    userId: number,
    refreshToken: string,
    expiresAt: Date,
  ): Promise<boolean> {
    await this.txHost.tx.authActivatedRefreshTokens.create({
      data: { userId, refreshToken, expiresAt },
    });
    return true;
  }

  async deleteRefreshTokenRecord(
    userId: number,
    refreshToken: string,
  ): Promise<boolean> {
    const result = await this.txHost.tx.authActivatedRefreshTokens.deleteMany({
      where: { userId, refreshToken, expiresAt: { gte: this.clock.now() } },
    });
    if (result.count !== 1) throw new Error("deleteRefreshTokenRecord failed");
    return true;
  }
}
