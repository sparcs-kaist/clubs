import { Injectable } from "@nestjs/common";
import { TransactionHost } from "@nestjs-cls/transactional";
import { type OfficeHour, Prisma } from "@prisma/client";

import { PrismaTransactionalAdapter } from "@sparcs-clubs/api/common/transaction/transaction.type";

export type OfficeHourRow = Pick<
  OfficeHour,
  "date" | "opensAt" | "closesAt" | "isClosed" | "version"
>;

export type OfficeHourKey = Pick<OfficeHourRow, "date" | "version">;

type OfficeHourWrite = OfficeHourRow &
  Pick<OfficeHour, "updatedAt" | "updatedByExecutiveId">;

const officeHourSelect = {
  date: true,
  opensAt: true,
  closesAt: true,
  isClosed: true,
  version: true,
} as const;

@Injectable()
export class OfficeHoursRepository {
  constructor(
    private readonly txHost: TransactionHost<PrismaTransactionalAdapter>,
  ) {}

  async list(from: string, to: string): Promise<OfficeHourRow[]> {
    const groups = await this.txHost.tx.officeHour.groupBy({
      by: ["date"],
      where: { date: { gte: from, lte: to } },
      _max: { version: true },
    });
    return this.listVersions(
      groups.map(({ date, _max }) => ({ date, version: _max.version })),
    );
  }

  async listVersions(keys: readonly OfficeHourKey[]): Promise<OfficeHourRow[]> {
    if (keys.length === 0) return [];
    return this.txHost.tx.officeHour.findMany({
      where: { OR: keys.map(({ date, version }) => ({ date, version })) },
      orderBy: [{ date: "asc" }, { version: "asc" }],
      select: officeHourSelect,
    });
  }

  async listDayVersions(date: string): Promise<OfficeHourRow[]> {
    return this.txHost.tx.officeHour.findMany({
      where: { date },
      orderBy: { version: "asc" },
      select: officeHourSelect,
    });
  }

  async findLatest(date: string): Promise<OfficeHourRow | null> {
    return this.txHost.tx.officeHour.findFirst({
      where: { date },
      orderBy: { version: "desc" },
      select: officeHourSelect,
    });
  }

  async createMissing(data: OfficeHourWrite[]): Promise<number> {
    if (data.length === 0) return 0;
    const result = await this.txHost.tx.officeHour.createMany({
      data,
      skipDuplicates: true,
    });
    return result.count;
  }

  async append(data: OfficeHourWrite): Promise<OfficeHourRow | null> {
    try {
      return await this.txHost.tx.officeHour.create({
        data,
        select: officeHourSelect,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") return null;
      }
      throw error;
    }
  }
}
