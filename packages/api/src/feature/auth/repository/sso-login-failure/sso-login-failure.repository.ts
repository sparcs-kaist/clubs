import { Injectable } from "@nestjs/common";
import { TransactionHost } from "@nestjs-cls/transactional";
import { Prisma } from "@prisma/client";

import { PrismaTransactionalAdapter } from "@sparcs-clubs/api/common/transaction/transaction.type";

@Injectable()
export class SsoLoginFailureRepository {
  constructor(
    private readonly txHost: TransactionHost<PrismaTransactionalAdapter>,
  ) {}

  async create(data: Prisma.AuthSsoLoginFailureLogCreateInput): Promise<void> {
    // The interceptor runs after the login transaction has ended, so tx falls
    // back to the root client and the failure row survives the login rollback.
    await this.txHost.tx.authSsoLoginFailureLog.create({ data });
  }
}
