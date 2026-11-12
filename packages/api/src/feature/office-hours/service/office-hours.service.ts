import { ConflictException, Inject, Injectable } from "@nestjs/common";
import { Transactional } from "@nestjs-cls/transactional";

import type {
  OfficeDateRange,
  OfficeHourInput,
} from "@clubs/interface/api/office-hours";

import { CLOCK, type Clock } from "@sparcs-clubs/api/common/clock/clock";

import {
  OfficeHourRow,
  OfficeHoursRepository,
} from "../repository/office-hours.repository";

const defaultOfficeDays = new Set([1, 2, 3, 4]);
const millisecondsPerDay = 86_400_000;

function atKstTime(date: string, time: string): Date {
  return new Date(`${date}T${time}:00+09:00`);
}

function hasOfficeHourChanged(
  current: OfficeHourRow,
  updated: Omit<OfficeHourRow, "date" | "version">,
): boolean {
  const openingChanged =
    current.opensAt.getTime() !== updated.opensAt.getTime();
  const closingChanged =
    current.closesAt.getTime() !== updated.closesAt.getTime();
  const closureChanged = current.isClosed !== updated.isClosed;
  const hasChanged = openingChanged || closingChanged || closureChanged;
  return hasChanged;
}

@Injectable()
export class OfficeHoursService {
  constructor(
    private readonly officeHoursRepository: OfficeHoursRepository,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  @Transactional()
  async generate(
    { from, to }: OfficeDateRange,
    executiveId: number,
  ): Promise<{ createdCount: number }> {
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
      if (scheduled) {
        const date = calendarDate.toISOString().slice(0, 10);
        rows.push({
          date,
          opensAt: atKstTime(date, "21:00"),
          closesAt: atKstTime(date, "22:00"),
          isClosed: false,
          version: 1,
          updatedAt,
          updatedByExecutiveId: executiveId,
        });
      }
    }

    const createdCount = await this.officeHoursRepository.createMissing(rows);
    return { createdCount };
  }

  @Transactional()
  async put(
    date: string,
    { openTime, closeTime, isClosed }: OfficeHourInput,
    executiveId: number,
  ): Promise<OfficeHourRow> {
    const times = {
      opensAt: atKstTime(date, openTime),
      closesAt: atKstTime(date, closeTime),
      isClosed,
    };
    const current = await this.officeHoursRepository.findLatest(date);
    if (current) {
      const changed = hasOfficeHourChanged(current, times);
      if (!changed) return current;
    }

    const revision = await this.officeHoursRepository.append({
      date,
      ...times,
      version: (current?.version ?? 0) + 1,
      updatedAt: this.clock.now(),
      updatedByExecutiveId: executiveId,
    });
    if (!revision) {
      throw new ConflictException(
        "상근 일정이 변경되었습니다. 다시 확인해주세요.",
      );
    }
    return revision;
  }
}
