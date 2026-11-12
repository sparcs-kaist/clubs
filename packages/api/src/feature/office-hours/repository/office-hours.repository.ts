import { Injectable } from "@nestjs/common";
import { TransactionHost } from "@nestjs-cls/transactional";
import { type OfficeHour, Prisma } from "@prisma/client";

import { PrismaTransactionalAdapter } from "@sparcs-clubs/api/common/transaction/transaction.type";
import {
  formatKstDate,
  parseKstDate,
} from "@sparcs-clubs/api/common/util/calendar-date";

type OfficeHourRecord = Pick<
  OfficeHour,
  "date" | "opensAt" | "closesAt" | "isClosed" | "version"
>;

export type OfficeHourRow = Omit<OfficeHourRecord, "date"> & { date: string };

export type OfficeHourKey = Pick<OfficeHourRow, "date" | "version">;

type OfficeHourRecordKey = Pick<OfficeHourRecord, "date" | "version">;

type OfficeHourWrite = OfficeHourRow &
  Pick<OfficeHour, "updatedAt" | "updatedByExecutiveId">;

const officeHourSelect = {
  date: true,
  opensAt: true,
  closesAt: true,
  isClosed: true,
  version: true,
} as const;

function toRow(record: OfficeHourRecord): OfficeHourRow {
  return { ...record, date: formatKstDate(record.date) };
}

@Injectable()
export class OfficeHoursRepository {
  constructor(
    private readonly txHost: TransactionHost<PrismaTransactionalAdapter>,
  ) {}

  async list(from: string, to: string): Promise<OfficeHourRow[]> {
    const groups = await this.txHost.tx.officeHour.groupBy({
      by: ["date"],
      where: { date: { gte: parseKstDate(from), lte: parseKstDate(to) } },
      _max: { version: true },
    });
    return this.findVersions(
      groups.map(({ date, _max }) => ({ date, version: _max.version })),
    );
  }

  async listVersions(keys: readonly OfficeHourKey[]): Promise<OfficeHourRow[]> {
    return this.findVersions(
      keys.map(({ date, version }) => ({ date: parseKstDate(date), version })),
    );
  }

  async listDayVersions(date: string): Promise<OfficeHourRow[]> {
    const rows = await this.txHost.tx.officeHour.findMany({
      where: { date: parseKstDate(date) },
      orderBy: { version: "asc" },
      select: officeHourSelect,
    });
    return rows.map(toRow);
  }

  async findLatest(date: string): Promise<OfficeHourRow | null> {
    const row = await this.txHost.tx.officeHour.findFirst({
      where: { date: parseKstDate(date) },
      orderBy: { version: "desc" },
      select: officeHourSelect,
    });
    return row ? toRow(row) : null;
  }

  async createMissing(data: OfficeHourWrite[]): Promise<number> {
    if (data.length === 0) return 0;
    const result = await this.txHost.tx.officeHour.createMany({
      data: data.map(row => ({ ...row, date: parseKstDate(row.date) })),
      skipDuplicates: true,
    });
    return result.count;
  }

  async append(data: OfficeHourWrite): Promise<OfficeHourRow | null> {
    try {
      const row = await this.txHost.tx.officeHour.create({
        data: { ...data, date: parseKstDate(data.date) },
        select: officeHourSelect,
      });
      return toRow(row);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") return null;
      }
      throw error;
    }
  }

  private async findVersions(
    keys: OfficeHourRecordKey[],
  ): Promise<OfficeHourRow[]> {
    if (keys.length === 0) return [];
    const rows = await this.txHost.tx.officeHour.findMany({
      where: { OR: keys },
      orderBy: [{ date: "asc" }, { version: "asc" }],
      select: officeHourSelect,
    });
    return rows.map(toRow);
  }
}
