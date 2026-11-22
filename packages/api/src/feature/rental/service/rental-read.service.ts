import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import type { RentalItem as ItemRow } from "@prisma/client";
import type { z } from "zod";

import {
  type apiRentalsExecutive,
  type ExecutiveRentalReservation,
  type RentalItem,
  type RentalReservation,
  zRentalDuration,
  zRentalStatus,
} from "@clubs/interface/api/rental/v2";
import type { IStudentSummary } from "@clubs/interface/api/user/type/user.type";

import { CLOCK, type Clock } from "@sparcs-clubs/api/common/clock/clock";
import ClubPublicService from "@sparcs-clubs/api/feature/club/service/club.public.service";
import { OfficeHoursPublicService } from "@sparcs-clubs/api/feature/office-hours/publicService/office-hours.public.service";
import UserPublicService from "@sparcs-clubs/api/feature/user/service/user.public.service";

import {
  RentalRepository,
  type RentalReservationRow as ReservationRow,
} from "../repository/rental.repository";
import {
  beforeSameDayReturns,
  checkoutQuantity,
  hasSameDayReturn,
  peakReservedQuantity,
} from "./rental-policy";
import {
  bookedHourIds,
  type BookedRental,
  type OfficeWindow,
  RentalScheduleService,
  requireBookedWindow,
  serializeWindow,
  withBookedWindows,
} from "./rental-schedule.service";

export function serializeItem(row: ItemRow): RentalItem {
  return {
    id: row.id,
    name: row.name,
    totalQuantity: row.totalQuantity,
    ...zRentalDuration.parse(row),
    isActive: row.isActive,
  };
}

function windowChanged(saved: OfficeWindow, current: OfficeWindow | undefined) {
  if (!current) return true;
  if (current.isClosed) return true;
  if (+saved.opensAt !== +current.opensAt) return true;
  return +saved.closesAt !== +current.closesAt;
}

function isExpiredPickup(row: BookedRental, now: Date) {
  if (row.status !== "RESERVED") return false;
  return row.pickup.closesAt <= now;
}

function appointmentNeedsAttention(
  row: BookedRental,
  now: Date,
  calendar: Map<string, OfficeWindow>,
) {
  if (row.status === "RESERVED") {
    if (isExpiredPickup(row, now)) return true;
    if (windowChanged(row.pickup, calendar.get(row.pickupDate))) return true;
    return windowChanged(row.returned, calendar.get(row.returnDate));
  }
  if (row.status === "CHECKED_OUT") {
    return windowChanged(row.returned, calendar.get(row.returnDate));
  }
  return false;
}

function requiresReturn(
  row: BookedRental,
  total: number,
  active: BookedRental[],
) {
  if (row.status !== "RESERVED") return false;
  if (!hasSameDayReturn(active, row.pickupDate)) return false;
  const before = beforeSameDayReturns(total, active, row.pickupDate, row.id);
  return before < row.quantity;
}

function hasDependentPickup(
  row: BookedRental,
  total: number,
  active: BookedRental[],
) {
  if (row.status !== "CHECKED_OUT") return false;
  return active.some(pickup => {
    if (pickup.pickupDate !== row.returnDate) return false;
    return requiresReturn(pickup, total, active);
  });
}

function waitingForReturn(
  row: BookedRental,
  total: number,
  active: BookedRental[],
  now: Date,
) {
  if (row.status !== "RESERVED") return false;
  if (row.pickup.opensAt > now) return false;
  if (row.pickup.closesAt <= now) return false;
  return checkoutQuantity(total, active, row) < row.quantity;
}

function isOverdue(row: BookedRental, now: Date) {
  if (row.status !== "CHECKED_OUT") return false;
  return row.returned.closesAt <= now;
}

function requireReference<T>(value: T | undefined): T {
  if (value === undefined) {
    throw new InternalServerErrorException("RENTAL_REFERENCE_NOT_FOUND");
  }
  return value;
}

type RentalQuery = z.output<typeof apiRentalsExecutive.requestQuery>;

@Injectable()
export class RentalReadService {
  constructor(
    private readonly repository: RentalRepository,
    private readonly officeHours: OfficeHoursPublicService,
    private readonly schedule: RentalScheduleService,
    private readonly clubs: ClubPublicService,
    private readonly users: UserPublicService,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async items(includeInactive: boolean) {
    return {
      items: (await this.repository.listItems(includeInactive)).map(
        serializeItem,
      ),
    };
  }

  async returnOptions(itemId: number, date: string) {
    const item = await this.repository.findItem(itemId);
    if (!item?.isActive) throw new NotFoundException("ITEM_NOT_FOUND");
    const duration = zRentalDuration.parse(item);
    const { pickup, returns } = await this.schedule.availableDates(
      duration,
      date,
    );
    if (!pickup) throw new BadRequestException("INVALID_PICKUP_DATE");
    const now = this.clock.now();
    if (pickup.closesAt <= now)
      throw new BadRequestException("INVALID_PICKUP_DATE");
    const rows = await this.repository.listActiveReservations([itemId]);
    const active = await this.schedule.bookedRentals(rows);
    const planned = active.filter(row => !isExpiredPickup(row, now));
    const availableWithoutSameDayReturns = beforeSameDayReturns(
      item.totalQuantity,
      planned,
      date,
    );
    return {
      pickup: serializeWindow(pickup),
      options: returns.map(window => {
        const used = peakReservedQuantity(active, date, window.date);
        const availableQuantity = Math.max(item.totalQuantity - used, 0);
        return {
          ...serializeWindow(window),
          availableQuantity,
          availableWithoutSameDayReturns: Math.min(
            availableQuantity,
            availableWithoutSameDayReturns,
          ),
        };
      }),
    };
  }

  async myList(studentId: number, query: RentalQuery) {
    const now = this.clock.now();
    const { items, ...page } = await this.listReservations(
      query,
      now,
      studentId,
    );
    return { ...page, items: await this.views(items, now) };
  }

  async myDetail(id: number, studentId: number) {
    const row = await this.requireReservation(id);
    if (row.studentId !== studentId)
      throw new NotFoundException("RENTAL_NOT_FOUND");
    const [view] = await this.views([row], this.clock.now());
    return view;
  }

  async executiveList(query: RentalQuery) {
    const now = this.clock.now();
    const { items, ...page } = await this.listReservations(query, now);
    const [views, students] = await Promise.all([
      this.views(items, now),
      this.studentSummaries(items),
    ]);
    return {
      ...page,
      items: items.map((row, index) =>
        this.executiveView(
          row,
          views[index],
          requireReference(students.get(row.studentId)),
        ),
      ),
    };
  }

  async executiveDetail(id: number) {
    const row = await this.requireReservation(id);
    const [views, extensions, students] = await Promise.all([
      this.views([row], this.clock.now()),
      this.repository.listExtensions(id),
      this.studentSummaries([row]),
    ]);
    const extensionWindows = await this.schedule.bookedWindows(
      extensions.flatMap(extension => [
        extension.previousReturnHourId,
        extension.newReturnHourId,
      ]),
    );
    return {
      ...this.executiveView(
        row,
        views[0],
        requireReference(students.get(row.studentId)),
      ),
      extensions: extensions.map(extension => ({
        previousReturnDate: requireBookedWindow(
          extensionWindows,
          extension.previousReturnHourId,
        ).date,
        newReturnDate: requireBookedWindow(
          extensionWindows,
          extension.newReturnHourId,
        ).date,
        reason: extension.reason,
        processedByExecutiveId: extension.processedByExecutiveId,
        processedAt: extension.processedAt.toISOString(),
      })),
    };
  }

  private async requireReservation(id: number) {
    const row = await this.repository.findReservation(id);
    if (!row) throw new NotFoundException("RENTAL_NOT_FOUND");
    return row;
  }

  private async listReservations(
    query: RentalQuery,
    now: Date,
    studentId?: number,
  ) {
    const [officeHourIds, overdueReturnHourIds] = await Promise.all([
      query.officeDate === undefined
        ? undefined
        : this.officeHours.listIdsByDate(query.officeDate),
      query.overdue === undefined
        ? undefined
        : this.officeHours.listIdsClosedBy(now),
    ]);
    return this.repository.listReservations(
      query,
      { officeHourIds, overdueReturnHourIds },
      studentId,
    );
  }

  private async studentSummaries(rows: ReservationRow[]) {
    const studentIds = [...new Set(rows.map(row => row.studentId))];
    const students =
      await this.users.fetchStudentSummariesIncludingDeleted(studentIds);
    return new Map(students.map(student => [student.id, student]));
  }

  private async views(
    rows: ReservationRow[],
    now: Date,
  ): Promise<RentalReservation[]> {
    if (rows.length === 0) return [];
    const itemIds = [...new Set(rows.map(row => row.itemId))];
    const clubIds = [...new Set(rows.map(row => row.clubId))];
    const extensions = rows
      .map(row => row.approvedExtensionId)
      .filter(id => id !== null);
    const [items, activeRows, clubs, approvals] = await Promise.all([
      this.repository.listItemsByIds(itemIds),
      this.repository.listActiveReservations(itemIds),
      this.clubs.fetchNamesIncludingDeleted(clubIds),
      this.repository.listExtensionsByIds(extensions),
    ]);
    const bookedWindows = await this.schedule.bookedWindows([
      ...bookedHourIds(rows),
      ...bookedHourIds(activeRows),
      ...approvals.map(approval => approval.newReturnHourId),
    ]);
    const booked = rows.map(row => withBookedWindows(row, bookedWindows));
    const active = activeRows.map(row => withBookedWindows(row, bookedWindows));
    const dates = booked
      .flatMap(row => [row.pickupDate, row.returnDate])
      .sort();
    const windows = await this.officeHours.list(
      dates[0],
      dates[dates.length - 1],
    );
    const calendar = new Map(windows.map(window => [window.date, window]));
    const itemsById = new Map(items.map(item => [item.id, item]));
    const clubNames = new Map(clubs.map(club => [club.id, club.nameKr]));
    const approvedLimits = new Map(
      approvals.map(approval => [
        approval.id,
        requireBookedWindow(bookedWindows, approval.newReturnHourId).date,
      ]),
    );

    return booked.map(row => {
      const item = requireReference(itemsById.get(row.itemId));
      const itemReservations = active.filter(
        rental => rental.itemId === row.itemId,
      );
      const total = item.totalQuantity;
      const planned = itemReservations.filter(
        rental => !isExpiredPickup(rental, now),
      );
      return {
        id: row.id,
        clubId: row.clubId,
        clubName: requireReference(clubNames.get(row.clubId)),
        itemId: row.itemId,
        itemName: item.name,
        quantity: row.quantity,
        status: zRentalStatus.parse(row.status),
        pickup: serializeWindow(row.pickup),
        return: serializeWindow(row.returned),
        regularReturnLimitDate: row.regularReturnLimitDate,
        approvedReturnLimitDate:
          row.approvedExtensionId === null
            ? null
            : requireReference(approvedLimits.get(row.approvedExtensionId)),
        ...zRentalDuration.parse(row),
        createdAt: row.createdAt.toISOString(),
        checkedOutAt: row.checkedOutAt?.toISOString() ?? null,
        returnedAt: row.returnedAt?.toISOString() ?? null,
        overdue: isOverdue(row, now),
        needsReschedule: appointmentNeedsAttention(row, now, calendar),
        requiresSameDayReturn: isExpiredPickup(row, now)
          ? false
          : requiresReturn(row, total, planned),
        hasDependentPickup: hasDependentPickup(row, total, planned),
        waitingForReturn: waitingForReturn(row, total, itemReservations, now),
        closeReason: row.closeReason,
      };
    });
  }

  private executiveView(
    row: ReservationRow,
    view: RentalReservation,
    student: IStudentSummary,
  ): ExecutiveRentalReservation {
    return {
      ...view,
      studentId: row.studentId,
      studentName: student.name,
      studentNumber: student.studentNumber,
      contactPhoneNumber: row.contactPhoneNumber,
      purpose: row.purpose,
      checkoutMemo: row.checkoutMemo,
      checkedOutByExecutiveId: row.checkedOutByExecutiveId,
      returnedByExecutiveId: row.returnedByExecutiveId,
      extensions: [],
    };
  }
}
