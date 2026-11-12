import {
  BadRequestException,
  ConflictException,
  Injectable,
} from "@nestjs/common";
import type { RentalReservation } from "@prisma/client";

import type {
  RentalPeriodPolicy,
  RentalSlot,
  RentalSlotSelection,
} from "@clubs/interface/api/rental/v2";

import { OfficeHoursPublicService } from "@sparcs-clubs/api/feature/office-hours/publicService/office-hours.public.service";

import { addRentalDays, regularReturnLimit } from "./rental-policy";

export type OfficeWindow = Awaited<
  ReturnType<OfficeHoursPublicService["list"]>
>[number];

const koreaDate = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul" });

export function rentalDate(now: Date) {
  return koreaDate.format(now);
}

export function serializeWindow(
  window: Omit<OfficeWindow, "isClosed">,
): RentalSlot {
  return {
    date: window.date,
    opensAt: window.opensAt.toISOString(),
    closesAt: window.closesAt.toISOString(),
    version: window.version,
  };
}

export function pickupKey(
  rental: Pick<RentalReservation, "pickupDate" | "pickupVersion">,
): RentalSlotSelection {
  return { date: rental.pickupDate, version: rental.pickupVersion };
}

export function returnKey(
  rental: Pick<RentalReservation, "returnDate" | "returnVersion">,
): RentalSlotSelection {
  return { date: rental.returnDate, version: rental.returnVersion };
}

@Injectable()
export class RentalScheduleService {
  constructor(private readonly officeHours: OfficeHoursPublicService) {}

  async availableDates(policy: RentalPeriodPolicy, pickupDate: string) {
    // The second next shift may fall after a holiday or semester break.
    const lastDate = addRentalDays(pickupDate, policy === "DAYS_14" ? 14 : 365);
    const windows = await this.officeHours.list(pickupDate, lastDate);
    const open = windows.filter(window => !window.isClosed);
    const pickup = open.find(window => window.date === pickupDate);
    const candidates = open.filter(window => window.date > pickupDate);
    const limit = regularReturnLimit(
      policy,
      pickupDate,
      candidates.map(window => window.date),
    );
    const returns =
      limit === undefined
        ? []
        : candidates.filter(window => window.date <= limit);
    return { pickup, limit, returns };
  }

  async resolve(selection: RentalSlotSelection, now: Date) {
    const [window] = await this.officeHours.list(
      selection.date,
      selection.date,
    );
    return this.requireSelection(window, selection, now);
  }

  requireSelection(
    window: OfficeWindow | undefined,
    selection: RentalSlotSelection,
    now: Date,
  ) {
    if (!window) throw new ConflictException("OFFICE_HOURS_CHANGED");
    if (window.isClosed) throw new ConflictException("OFFICE_HOURS_CHANGED");
    if (window.version !== selection.version)
      throw new ConflictException("OFFICE_HOURS_CHANGED");
    if (window.closesAt <= now)
      throw new BadRequestException("OFFICE_HOURS_PASSED");
    return window;
  }

  async resolveBooked(selection: RentalSlotSelection, now: Date) {
    const versions = await this.officeHours.listDayVersions(selection.date);
    const current = versions.at(-1);
    const booked = versions.find(
      window => window.version === selection.version,
    );
    if (!current) throw new ConflictException("OFFICE_HOURS_CHANGED");
    if (!booked) throw new ConflictException("OFFICE_HOURS_CHANGED");
    if (current.isClosed) throw new ConflictException("OFFICE_HOURS_CHANGED");
    if (+current.opensAt !== +booked.opensAt)
      throw new ConflictException("OFFICE_HOURS_CHANGED");
    if (+current.closesAt !== +booked.closesAt)
      throw new ConflictException("OFFICE_HOURS_CHANGED");
    if (booked.closesAt <= now)
      throw new BadRequestException("OFFICE_HOURS_PASSED");
    return booked;
  }

  async requireRegularLimit(policy: RentalPeriodPolicy, pickupDate: string) {
    const { limit } = await this.availableDates(policy, pickupDate);
    if (!limit) throw new ConflictException("OFFICE_HOURS_NOT_PUBLISHED");
    return limit;
  }
}
