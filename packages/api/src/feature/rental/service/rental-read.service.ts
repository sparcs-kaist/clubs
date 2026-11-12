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
  type RentalSlotSelection,
  zRentalPeriodPolicy,
  zRentalStatus,
} from "@clubs/interface/api/rental/v2";
import type { IStudentSummary } from "@clubs/interface/api/user/type/user.type";

import { CLOCK, Clock } from "@sparcs-clubs/api/common/clock/clock";
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
  type OfficeWindow,
  pickupKey,
  rentalDate,
  RentalScheduleService,
  returnKey,
  serializeWindow,
} from "./rental-schedule.service";

export function serializeItem(row: ItemRow): RentalItem {
  return {
    id: row.id,
    name: row.name,
    totalQuantity: row.totalQuantity,
    durationPolicy: zRentalPeriodPolicy.parse(row.durationPolicy),
    isActive: row.isActive,
  };
}

function windowChanged(saved: OfficeWindow, current: OfficeWindow | undefined) {
  if (!current) return true;
  if (current.isClosed) return true;
  if (+saved.opensAt !== +current.opensAt) return true;
  return +saved.closesAt !== +current.closesAt;
}

interface ReadTime {
  now: Date;
  date: string;
  elapsedVersions: number[];
}

function isExpiredPickup(row: ReservationRow, time: ReadTime) {
  if (row.status !== "RESERVED") return false;
  if (row.pickupDate !== time.date) return row.pickupDate < time.date;
  return time.elapsedVersions.includes(row.pickupVersion);
}

function appointmentNeedsAttention(
  row: ReservationRow,
  pickup: OfficeWindow,
  returned: OfficeWindow,
  now: Date,
  calendar: Map<string, OfficeWindow>,
) {
  if (row.status === "RESERVED") {
    if (pickup.closesAt <= now) return true;
    if (windowChanged(pickup, calendar.get(row.pickupDate))) return true;
    return windowChanged(returned, calendar.get(row.returnDate));
  }
  if (row.status === "CHECKED_OUT") {
    return windowChanged(returned, calendar.get(row.returnDate));
  }
  return false;
}

function requiresReturn(
  row: ReservationRow,
  total: number,
  active: ReservationRow[],
) {
  if (row.status !== "RESERVED") return false;
  if (!hasSameDayReturn(active, row.pickupDate)) return false;
  const before = beforeSameDayReturns(total, active, row.pickupDate, row.id);
  return before < row.quantity;
}

function hasDependentPickup(
  row: ReservationRow,
  total: number,
  active: ReservationRow[],
) {
  if (row.status !== "CHECKED_OUT") return false;
  return active.some(pickup => {
    if (pickup.pickupDate !== row.returnDate) return false;
    return requiresReturn(pickup, total, active);
  });
}

function waitingForReturn(
  row: ReservationRow,
  pickup: OfficeWindow,
  total: number,
  active: ReservationRow[],
  now: Date,
) {
  if (row.status !== "RESERVED") return false;
  if (pickup.opensAt > now) return false;
  if (pickup.closesAt <= now) return false;
  return checkoutQuantity(total, active, row) < row.quantity;
}

function isOverdue(row: ReservationRow, returned: OfficeWindow, now: Date) {
  if (row.status !== "CHECKED_OUT") return false;
  return returned.closesAt <= now;
}

function versionKey(window: RentalSlotSelection) {
  return `${window.date}/${window.version}`;
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
    const policy = zRentalPeriodPolicy.parse(item.durationPolicy);
    const { pickup, returns } = await this.schedule.availableDates(
      policy,
      date,
    );
    if (!pickup) throw new BadRequestException("INVALID_PICKUP_DATE");
    const now = this.clock.now();
    if (pickup.closesAt <= now)
      throw new BadRequestException("INVALID_PICKUP_DATE");
    const [active, time] = await Promise.all([
      this.repository.listActiveReservations([itemId]),
      this.readTime(now),
    ]);
    const planned = active.filter(row => !isExpiredPickup(row, time));
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
    const time = await this.readTime();
    const { items, ...page } = await this.repository.listReservations(
      query,
      time.date,
      time.elapsedVersions,
      studentId,
    );
    return { ...page, items: await this.views(items, time) };
  }

  async myDetail(id: number, studentId: number) {
    const row = await this.requireReservation(id);
    if (row.studentId !== studentId)
      throw new NotFoundException("RENTAL_NOT_FOUND");
    const [view] = await this.views([row], await this.readTime());
    return view;
  }

  async executiveList(query: RentalQuery) {
    const time = await this.readTime();
    const { items, ...page } = await this.repository.listReservations(
      query,
      time.date,
      time.elapsedVersions,
    );
    const [views, students] = await Promise.all([
      this.views(items, time),
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
      this.readTime().then(time => this.views([row], time)),
      this.repository.listExtensions(id),
      this.studentSummaries([row]),
    ]);
    return {
      ...this.executiveView(
        row,
        views[0],
        requireReference(students.get(row.studentId)),
      ),
      extensions: extensions.map(extension => ({
        previousReturnDate: extension.previousReturnDate,
        newReturnDate: extension.newReturnDate,
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

  private async readTime(now = this.clock.now()): Promise<ReadTime> {
    const date = rentalDate(now);
    const versions = await this.officeHours.listDayVersions(date);
    const elapsedVersions = versions
      .filter(version => version.closesAt <= now)
      .map(version => version.version);
    return { now, date, elapsedVersions };
  }

  private async studentSummaries(rows: ReservationRow[]) {
    const studentIds = [...new Set(rows.map(row => row.studentId))];
    const students =
      await this.users.fetchStudentSummariesIncludingDeleted(studentIds);
    return new Map(students.map(student => [student.id, student]));
  }

  private async views(
    rows: ReservationRow[],
    time: ReadTime,
  ): Promise<RentalReservation[]> {
    if (rows.length === 0) return [];
    const itemIds = [...new Set(rows.map(row => row.itemId))];
    const clubIds = [...new Set(rows.map(row => row.clubId))];
    const extensions = rows
      .map(row => row.approvedExtensionId)
      .filter(id => id !== null);
    const keys = rows.flatMap(row => [pickupKey(row), returnKey(row)]);
    const dates = keys.map(key => key.date).sort();
    const [items, active, windows, versions, clubs, approvals] =
      await Promise.all([
        this.repository.listItemsByIds(itemIds),
        this.repository.listActiveReservations(itemIds),
        this.officeHours.list(dates[0], dates[dates.length - 1]),
        this.officeHours.listVersions(keys),
        this.clubs.fetchNamesIncludingDeleted(clubIds),
        this.repository.listExtensionsByIds(extensions),
      ]);
    const calendar = new Map(windows.map(window => [window.date, window]));
    const history = new Map(
      versions.map(window => [versionKey(window), window]),
    );
    const itemsById = new Map(items.map(item => [item.id, item]));
    const clubNames = new Map(clubs.map(club => [club.id, club.nameKr]));
    const approvedLimits = new Map(
      approvals.map(approval => [approval.id, approval.newReturnDate]),
    );

    return rows.map(row => {
      const item = requireReference(itemsById.get(row.itemId));
      const pickup = requireReference(history.get(versionKey(pickupKey(row))));
      const returned = requireReference(
        history.get(versionKey(returnKey(row))),
      );
      const itemReservations = active.filter(
        rental => rental.itemId === row.itemId,
      );
      const total = item.totalQuantity;
      const planned = itemReservations.filter(
        rental => !isExpiredPickup(rental, time),
      );
      return {
        id: row.id,
        clubId: row.clubId,
        clubName: requireReference(clubNames.get(row.clubId)),
        itemId: row.itemId,
        itemName: item.name,
        quantity: row.quantity,
        status: zRentalStatus.parse(row.status),
        pickup: serializeWindow(pickup),
        return: serializeWindow(returned),
        regularReturnLimitDate: row.regularReturnLimitDate,
        approvedReturnLimitDate:
          row.approvedExtensionId === null
            ? null
            : requireReference(approvedLimits.get(row.approvedExtensionId)),
        durationPolicy: zRentalPeriodPolicy.parse(row.durationPolicy),
        createdAt: row.createdAt.toISOString(),
        checkedOutAt: row.checkedOutAt?.toISOString() ?? null,
        returnedAt: row.returnedAt?.toISOString() ?? null,
        overdue: isOverdue(row, returned, time.now),
        needsReschedule: appointmentNeedsAttention(
          row,
          pickup,
          returned,
          time.now,
          calendar,
        ),
        requiresSameDayReturn: isExpiredPickup(row, time)
          ? false
          : requiresReturn(row, total, planned),
        hasDependentPickup: hasDependentPickup(row, total, planned),
        waitingForReturn: waitingForReturn(
          row,
          pickup,
          total,
          itemReservations,
          time.now,
        ),
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
