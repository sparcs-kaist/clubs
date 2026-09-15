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

  async createExchangeLog(data: ExchangeLoginLogInput): Promise<void> {
    await this.txHost.tx.authExchangeLoginLog.create({ data });
  }
}
