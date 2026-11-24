import { ConflictException, Inject, Injectable } from "@nestjs/common";
import { Transactional } from "@nestjs-cls/transactional";
import { Prisma } from "@prisma/client";

import type {
  OfficeDateRange,
  OfficeHourInput,
  OfficeHourQuery,
} from "@clubs/interface/api/office-hours";

import { CLOCK, type Clock } from "@sparcs-clubs/api/common/clock/clock";
import type { PrismaTransactionalAdapter } from "@sparcs-clubs/api/common/transaction/transaction.type";

import {
  type ExecutiveOfficeHourRow,
  OfficeHoursRepository,
} from "../repository/office-hours.repository";

const defaultOfficeDays = new Set([1, 2, 3, 4]);
const millisecondsPerDay = 86_400_000;
const serializable = {
  isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
};

function atKstTime(date: string, time: string): Date {
  return new Date(`${date}T${time}:00+09:00`);
}

type OfficeHourSettings = Pick<
  ExecutiveOfficeHourRow,
  "opensAt" | "closesAt" | "isClosed" | "publicMemo" | "internalMemo"
>;

function hasOfficeHourChanged(
  current: OfficeHourSettings,
  updated: OfficeHourSettings,
): boolean {
  const openingChanged =
    current.opensAt.getTime() !== updated.opensAt.getTime();
  const closingChanged =
    current.closesAt.getTime() !== updated.closesAt.getTime();
  const closureChanged = current.isClosed !== updated.isClosed;
  const publicMemoChanged = current.publicMemo !== updated.publicMemo;
  const internalMemoChanged = current.internalMemo !== updated.internalMemo;
  const hasChanged =
    openingChanged ||
    closingChanged ||
    closureChanged ||
    publicMemoChanged ||
    internalMemoChanged;
  return hasChanged;
}

async function retryOfficeHourWrite<T>(write: () => Promise<T>): Promise<T> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      // eslint-disable-next-line no-await-in-loop -- the next attempt needs a fresh transaction
      return await write();
    } catch (error) {
      const knownError = error instanceof Prisma.PrismaClientKnownRequestError;
      if (!knownError) throw error;
      const { code } = error;
      if (code !== "P2034") throw error;
    }
  }
  throw new ConflictException("상근 일정이 변경되었습니다. 다시 확인해주세요.");
}

function nextMemo(input: string | null | undefined, current: string | null) {
  return input === undefined ? current : input || null;
}

@Injectable()
export class OfficeHoursService {
  constructor(
    private readonly officeHoursRepository: OfficeHoursRepository,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async list({ from, to }: OfficeHourQuery) {
    return this.officeHoursRepository.list(from, to ?? "9999-12-31");
  }

  async generate(range: OfficeDateRange, executiveId: number) {
    return retryOfficeHourWrite(() =>
      this.generateSchedule(range, executiveId),
    );
  }

  async put(date: string, input: OfficeHourInput, executiveId: number) {
    return retryOfficeHourWrite(() =>
      this.saveSchedule(date, input, executiveId),
    );
  }

  // Serializable locks the queried date range until any missing shifts are inserted.
  @Transactional<PrismaTransactionalAdapter>(serializable)
  private async generateSchedule(
    { from, to }: OfficeDateRange,
    executiveId: number,
  ): Promise<{ createdCount: number }> {
    const existing = await this.officeHoursRepository.list(from, to);
    const existingDates = new Set(existing.map(({ date }) => date));
    const updatedAt = this.clock.now();
    const end = Date.parse(to);
    const rows = [];
    for (
      let timestamp = Date.parse(from);
      timestamp <= end;
      timestamp += millisecondsPerDay
    ) {
      const calendarDate = new Date(timestamp);
      const scheduled = defaultOfficeDays.has(calendarDate.getUTCDay());
      const date = calendarDate.toISOString().slice(0, 10);
      const exists = existingDates.has(date);
      if (scheduled && !exists) {
        rows.push({
          date,
          opensAt: atKstTime(date, "21:00"),
          closesAt: atKstTime(date, "22:00"),
          isClosed: false,
          updatedAt,
          updatedByExecutiveId: executiveId,
        });
      }
    }

    const createdCount = await this.officeHoursRepository.createMissing(rows);
    return { createdCount };
  }

  @Transactional<PrismaTransactionalAdapter>(serializable)
  private async saveSchedule(
    date: string,
    {
      openTime,
      closeTime,
      isClosed,
      publicMemo,
      internalMemo,
    }: OfficeHourInput,
    executiveId: number,
  ): Promise<ExecutiveOfficeHourRow> {
    const current = await this.officeHoursRepository.findLatest(date);
    const settings = {
      opensAt: atKstTime(date, openTime),
      closesAt: atKstTime(date, closeTime),
      isClosed,
      publicMemo: nextMemo(publicMemo, current?.publicMemo ?? null),
      internalMemo: nextMemo(internalMemo, current?.internalMemo ?? null),
    };
    if (current) {
      const changed = hasOfficeHourChanged(current, settings);
      if (!changed) return current;
    }

    return this.officeHoursRepository.append({
      date,
      ...settings,
      updatedAt: this.clock.now(),
      updatedByExecutiveId: executiveId,
    });
  }
}
