import { Injectable } from "@nestjs/common";

import {
  type ExecutiveOfficeHourRow,
  type OfficeHourRow,
  OfficeHoursRepository,
} from "../repository/office-hours.repository";

function toSchedule({
  id,
  date,
  opensAt,
  closesAt,
  isClosed,
}: ExecutiveOfficeHourRow): OfficeHourRow {
  return { id, date, opensAt, closesAt, isClosed };
}

@Injectable()
export class OfficeHoursPublicService {
  constructor(private readonly officeHoursRepository: OfficeHoursRepository) {}

  async list(from: string, to: string): Promise<OfficeHourRow[]> {
    const rows = await this.officeHoursRepository.list(from, to);
    return rows.map(toSchedule);
  }

  async findLatest(date: string): Promise<OfficeHourRow | null> {
    const row = await this.officeHoursRepository.findLatest(date);
    return row ? toSchedule(row) : null;
  }

  async listByIds(ids: readonly number[]): Promise<OfficeHourRow[]> {
    const rows = await this.officeHoursRepository.listByIds(ids);
    return rows.map(toSchedule);
  }

  async listIdsByDate(date: string): Promise<number[]> {
    return this.officeHoursRepository.listIdsByDate(date);
  }

  async listIdsClosedBy(now: Date): Promise<number[]> {
    return this.officeHoursRepository.listIdsClosedBy(now);
  }
}
