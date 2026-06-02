import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { TransactionHost } from "@nestjs-cls/transactional";

import { PrismaTransactionalAdapter } from "@sparcs-clubs/api/common/transaction/transaction.type";

@Injectable()
export class OperationCommitteeRepository {
  constructor(
    private readonly txHost: TransactionHost<PrismaTransactionalAdapter>,
  ) {}

  async createOperationCommitteeSecretKey(secretKey: string) {
    // Soft-delete all existing active keys
    await this.txHost.tx.operationCommittee.updateMany({
      where: { deletedAt: null },
      data: { deletedAt: new Date() },
    });

    // Create a new key
    const inserted = await this.txHost.tx.operationCommittee.create({
      data: { secretKey },
    });

    if (!inserted) {
      throw new HttpException(
        "OperationCommittee creation failed.",
        HttpStatus.BAD_REQUEST,
      );
    }
    return inserted;
  }

  async findOperationCommitteeSecretKey() {
    const activeKeys = await this.txHost.tx.operationCommittee.findMany({
      where: { deletedAt: null },
    });

    if (!activeKeys || activeKeys.length === 0) {
      throw new HttpException(
        "No active secret key found.",
        HttpStatus.NOT_FOUND,
      );
    }

    return activeKeys;
  }

  async deleteOperationCommitteeSecretKey() {
    const recent = await this.txHost.tx.operationCommittee.findFirst({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
    });

    if (!recent) {
      throw new HttpException(
        "Current secretKey is missing.",
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.txHost.tx.operationCommittee.update({
      where: { id: recent.id },
      data: { deletedAt: new Date() },
    });
  }
}
