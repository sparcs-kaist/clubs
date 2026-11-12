import { Injectable } from "@nestjs/common";

import {
  type OfficeHourKey,
  type OfficeHourRow,
  OfficeHoursRepository,
} from "../repository/office-hours.repository";

export type { OfficeHourKey } from "../repository/office-hours.repository";

@Injectable()
export class OfficeHoursPublicService {
  constructor(private readonly officeHoursRepository: OfficeHoursRepository) {}

  async list(from: string, to: string): Promise<OfficeHourRow[]> {
    return this.officeHoursRepository.list(from, to);
  }

  async listVersions(keys: readonly OfficeHourKey[]): Promise<OfficeHourRow[]> {
    return this.officeHoursRepository.listVersions(keys);
  }

  async listDayVersions(date: string): Promise<OfficeHourRow[]> {
    return this.officeHoursRepository.listDayVersions(date);
  }
}
