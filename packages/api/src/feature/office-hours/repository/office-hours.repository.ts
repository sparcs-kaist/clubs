import { Injectable } from "@nestjs/common";
import { TransactionHost } from "@nestjs-cls/transactional";
import type { OfficeHour, Prisma } from "@prisma/client";

import { PrismaTransactionalAdapter } from "@sparcs-clubs/api/common/transaction/transaction.type";
import {
  formatKstDate,
  parseKstDate,
} from "@sparcs-clubs/api/common/util/calendar-date";

type OfficeHourRecord = Pick<
  OfficeHour,
  | "id"
  | "date"
  | "opensAt"
  | "closesAt"
  | "isClosed"
  | "publicMemo"
  | "internalMemo"
>;

export type ExecutiveOfficeHourRow = Omit<OfficeHourRecord, "date"> & {
  date: string;
};

export type OfficeHourRow = Omit<
  ExecutiveOfficeHourRow,
  "publicMemo" | "internalMemo"
>;

type OfficeHourWrite = Omit<OfficeHourRow, "id"> &
  Pick<OfficeHour, "updatedAt" | "updatedByExecutiveId"> &
  Partial<Pick<OfficeHour, "publicMemo" | "internalMemo">>;

const officeHourSelect = {
  id: true,
  date: true,
  opensAt: true,
  closesAt: true,
  isClosed: true,
  publicMemo: true,
  internalMemo: true,
} as const;

const latestFirst: Prisma.OfficeHourOrderByWithRelationInput[] = [
  { updatedAt: "desc" },
  { id: "desc" },
];

function toRow(record: OfficeHourRecord): ExecutiveOfficeHourRow {
  return { ...record, date: formatKstDate(record.date) };
}

@Injectable()
export class OfficeHoursRepository {
  constructor(
    private readonly txHost: TransactionHost<PrismaTransactionalAdapter>,
  ) {}

  async list(from: string, to: string): Promise<ExecutiveOfficeHourRow[]> {
    const rows = await this.txHost.tx.officeHour.findMany({
      where: { date: { gte: parseKstDate(from), lte: parseKstDate(to) } },
      distinct: ["date"],
      orderBy: [{ date: "asc" }, ...latestFirst],
      select: officeHourSelect,
    });
    return rows.map(toRow);
  }

  async findLatest(date: string): Promise<ExecutiveOfficeHourRow | null> {
    const row = await this.txHost.tx.officeHour.findFirst({
      where: { date: parseKstDate(date) },
      orderBy: latestFirst,
      select: officeHourSelect,
    });
    return row ? toRow(row) : null;
  }

  async listByIds(ids: readonly number[]): Promise<ExecutiveOfficeHourRow[]> {
    if (ids.length === 0) return [];
    const rows = await this.txHost.tx.officeHour.findMany({
      where: { id: { in: [...ids] } },
      select: officeHourSelect,
    });
    return rows.map(toRow);
  }

  async listIdsByDate(date: string): Promise<number[]> {
    const rows = await this.txHost.tx.officeHour.findMany({
      where: { date: parseKstDate(date) },
      select: { id: true },
    });
    return rows.map(({ id }) => id);
  }

  async listIdsClosedBy(now: Date): Promise<number[]> {
    const rows = await this.txHost.tx.officeHour.findMany({
      where: { closesAt: { lte: now } },
      select: { id: true },
    });
    return rows.map(({ id }) => id);
  }

  async createMissing(data: OfficeHourWrite[]): Promise<number> {
    if (data.length === 0) return 0;
    const result = await this.txHost.tx.officeHour.createMany({
      data: data.map(row => ({ ...row, date: parseKstDate(row.date) })),
    });
    return result.count;
  }

  async append(data: OfficeHourWrite): Promise<ExecutiveOfficeHourRow> {
    const row = await this.txHost.tx.officeHour.create({
      data: { ...data, date: parseKstDate(data.date) },
      select: officeHourSelect,
    });
    return toRow(row);
  }
}
