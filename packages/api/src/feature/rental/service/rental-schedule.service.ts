import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";

import type {
  RentalDuration,
  RentalSlot,
  RentalSlotSelection,
} from "@clubs/interface/api/rental/v2";

import { OfficeHoursPublicService } from "@sparcs-clubs/api/feature/office-hours/publicService/office-hours.public.service";

import type { RentalReservationRow } from "../repository/rental.repository";
import { addRentalDays, regularReturnLimit } from "./rental-policy";

export type OfficeWindow = Awaited<
  ReturnType<OfficeHoursPublicService["list"]>
>[number];

const koreaDate = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul" });

export function rentalDate(now: Date) {
  return koreaDate.format(now);
}

export function serializeWindow(window: OfficeWindow): RentalSlot {
  return {
    date: window.date,
    opensAt: window.opensAt.toISOString(),
    closesAt: window.closesAt.toISOString(),
  };
}

export function selectionMatches(
  window: OfficeWindow,
  selection: RentalSlotSelection,
) {
  if (window.date !== selection.date) return false;
  if (+window.opensAt !== Date.parse(selection.opensAt)) return false;
  return +window.closesAt === Date.parse(selection.closesAt);
}

export function bookedHourIds(rows: readonly RentalReservationRow[]) {
  return rows.flatMap(row => [row.pickupHourId, row.returnHourId]);
}

export function requireBookedWindow(
  windows: ReadonlyMap<number, OfficeWindow>,
  id: number,
) {
  const window = windows.get(id);
  if (!window)
    throw new InternalServerErrorException("RENTAL_REFERENCE_NOT_FOUND");
  return window;
}

export function withBookedWindows(
  row: RentalReservationRow,
  windows: ReadonlyMap<number, OfficeWindow>,
) {
  const pickup = requireBookedWindow(windows, row.pickupHourId);
  const returned = requireBookedWindow(windows, row.returnHourId);
  return {
    ...row,
    pickup,
    returned,
    pickupDate: pickup.date,
    returnDate: returned.date,
  };
}

export type BookedRental = ReturnType<typeof withBookedWindows>;

export function stockWindow(row: BookedRental): BookedRental {
  if (row.status !== "CHECKED_OUT") return row;
  if (row.checkedOutAt === null) return row;
  return {
    ...row,
    pickupDate: [row.pickupDate, rentalDate(row.checkedOutAt)].sort()[0],
  };
}

@Injectable()
export class RentalScheduleService {
  constructor(private readonly officeHours: OfficeHoursPublicService) {}

  async availableDates(duration: RentalDuration, pickupDate: string) {
    const lastDate =
      duration.durationType === "DAYS"
        ? addRentalDays(pickupDate, duration.durationValue)
        : "9999-12-31";
    if (lastDate === undefined) {
      throw new BadRequestException("INVALID_RENTAL_PERIOD");
    }
    const windows = await this.officeHours.list(pickupDate, lastDate);
    const open = windows.filter(window => !window.isClosed);
    const pickup = open.find(window => window.date === pickupDate);
    const candidates = open.filter(window => window.date > pickupDate);
    const limit = regularReturnLimit(
      duration,
      pickupDate,
      candidates.map(window => window.date),
    );
    const returns =
      limit === undefined
        ? []
        : candidates.filter(window => window.date <= limit);
    return { pickup, limit, returns };
  }

  async bookedWindows(ids: readonly number[]) {
    const rows = await this.officeHours.listByIds([...new Set(ids)]);
    return new Map(rows.map(window => [window.id, window]));
  }

  async bookedRentals(rows: readonly RentalReservationRow[]) {
    const windows = await this.bookedWindows(bookedHourIds(rows));
    return rows.map(row => withBookedWindows(row, windows));
  }

  async resolve(selection: RentalSlotSelection, now: Date) {
    const window = await this.officeHours.findLatest(selection.date);
    return this.requireSelection(window, selection, now);
  }

  requireSelection(
    window: OfficeWindow | null | undefined,
    selection: RentalSlotSelection,
    now: Date,
  ) {
    const current = this.requireCurrentSelection(window, selection);
    if (current.closesAt <= now)
      throw new BadRequestException("OFFICE_HOURS_PASSED");
    return current;
  }

  private requireCurrentSelection(
    window: OfficeWindow | null | undefined,
    selection: RentalSlotSelection,
  ) {
    if (!window) throw new ConflictException("OFFICE_HOURS_CHANGED");
    if (window.isClosed) throw new ConflictException("OFFICE_HOURS_CHANGED");
    if (!selectionMatches(window, selection))
      throw new ConflictException("OFFICE_HOURS_CHANGED");
    return window;
  }

  async resolveUnchangedBooked(booked: OfficeWindow) {
    const current = await this.officeHours.findLatest(booked.date);
    this.requireCurrentSelection(current, serializeWindow(booked));
    return booked;
  }

  async resolveBooked(booked: OfficeWindow, now: Date) {
    const current = await this.officeHours.findLatest(booked.date);
    this.requireSelection(current, serializeWindow(booked), now);
    return booked;
  }

  async requireRegularLimit(duration: RentalDuration, pickupDate: string) {
    const { limit } = await this.availableDates(duration, pickupDate);
    if (!limit) throw new ConflictException("OFFICE_HOURS_NOT_PUBLISHED");
    return limit;
  }
}
