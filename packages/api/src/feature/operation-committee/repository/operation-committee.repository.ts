import { HttpException, HttpStatus, Injectable } from "@nestjs/common";

import { PrismaService } from "@sparcs-clubs/api/prisma/prisma.service";

@Injectable()
export class OperationCommitteeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createOperationCommitteeSecretKey(secretKey: string) {
    // Soft-delete all existing active keys
    await this.prisma.operationCommittee.updateMany({
      where: { deletedAt: null },
      data: { deletedAt: new Date() },
    });

    // Create a new key
    const inserted = await this.prisma.operationCommittee.create({
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
    const activeKeys = await this.prisma.operationCommittee.findMany({
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
    const recent = await this.prisma.operationCommittee.findFirst({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
    });

    if (!recent) {
      throw new HttpException(
        "Current secretKey is missing.",
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.prisma.operationCommittee.update({
      where: { id: recent.id },
      data: { deletedAt: new Date() },
    });
  }
}
