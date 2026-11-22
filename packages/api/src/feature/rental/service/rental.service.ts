import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Transactional } from "@nestjs-cls/transactional";
import type { TransactionalAdapterPrisma } from "@nestjs-cls/transactional-adapter-prisma";
import { Prisma } from "@prisma/client";
import { createHash } from "node:crypto";
import type { z } from "zod";

import {
  type apiRentalCreate,
  type apiRentalItemCreate,
  type apiRentalItemUpdate,
  type apiRentalSchedule,
  type RentalSlotSelection,
  type RentalStatus,
  zRentalDuration,
  zRentalStatus,
} from "@clubs/interface/api/rental/v2";

import { CLOCK, type Clock } from "@sparcs-clubs/api/common/clock/clock";
import ClubPublicService from "@sparcs-clubs/api/feature/club/service/club.public.service";
import UserPublicService from "@sparcs-clubs/api/feature/user/service/user.public.service";

import {
  RentalRepository,
  type RentalReservationRow,
  type RentalReservationUpdate,
} from "../repository/rental.repository";
import {
  activeRentalStatus,
  addRentalDays,
  cancellableRentalStatus,
  checkoutQuantity,
  peakReservedQuantity,
  physicalQuantity,
  type ReservedStock,
  validReducedRentalQuantity,
} from "./rental-policy";
import {
  rentalDate,
  RentalScheduleService,
  requireBookedWindow,
  selectionMatches,
  stockWindow,
} from "./rental-schedule.service";

type CreateRental = z.output<typeof apiRentalCreate.requestBody>;
type ScheduleUpdate = z.output<typeof apiRentalSchedule.requestBody>;

const readCommitted = {
  isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
};

function assertCapacity(
  total: number,
  active: ReservedStock[],
  quantity: number,
  from: string,
  to: string,
) {
  if (peakReservedQuantity(active, from, to) + quantity > total) {
    throw new ConflictException("OUT_OF_STOCK");
  }
}

@Injectable()
export class RentalService {
  constructor(
    private readonly repository: RentalRepository,
    private readonly schedule: RentalScheduleService,
    private readonly clubs: ClubPublicService,
    private readonly users: UserPublicService,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async eligibleClubs(studentId: number) {
    const clubs = await this.clubs.findStudentClubDelegates(studentId);
    return { items: clubs.map(({ id, name }) => ({ id, name })) };
  }

  @Transactional<TransactionalAdapterPrisma>(readCommitted)
  async create(studentId: number, input: CreateRental) {
    await this.clubs.checkStudentDelegate(studentId, input.clubId);
    const club = await this.clubs.fetchSummary(input.clubId);
    const item = await this.lockItem(input.itemId);
    const fingerprint = createHash("sha256")
      .update(JSON.stringify(input))
      .digest("hex");
    const existing = await this.repository.findByRequest(
      studentId,
      input.clientRequestId,
    );
    if (existing) {
      if (existing.requestFingerprint !== fingerprint) {
        const legacyFingerprint = createHash("sha256")
          .update(
            JSON.stringify({
              clubId: input.clubId,
              itemId: input.itemId,
              quantity: input.quantity,
              pickup: input.pickup,
              return: input.return,
              contactPhoneNumber: existing.contactPhoneNumber,
              purpose: input.purpose,
              clientRequestId: input.clientRequestId,
            }),
          )
          .digest("hex");
        if (existing.requestFingerprint !== legacyFingerprint)
          throw new ConflictException("REQUEST_ID_REUSED");
      }
      return existing;
    }
    if (!item.isActive) throw new NotFoundException("ITEM_NOT_FOUND");

    const now = this.clock.now();
    const duration = zRentalDuration.parse(item);
    if (input.pickup.date >= input.return.date) {
      throw new BadRequestException("INVALID_RENTAL_PERIOD");
    }
    const dates = await this.schedule.availableDates(
      duration,
      input.pickup.date,
    );
    const pickup = this.schedule.requireSelection(
      dates.pickup,
      input.pickup,
      now,
    );
    const regularLimit = dates.limit;
    if (regularLimit === undefined)
      throw new ConflictException("OFFICE_HOURS_NOT_PUBLISHED");
    if (input.return.date > regularLimit)
      throw new BadRequestException("INVALID_RENTAL_PERIOD");
    const returnWindow = dates.returns.find(
      window => window.date === input.return.date,
    );
    const returned = this.schedule.requireSelection(
      returnWindow,
      input.return,
      now,
    );

    const active = await this.activeReservations(item.id);
    assertCapacity(
      item.totalQuantity,
      active,
      input.quantity,
      pickup.date,
      returned.date,
    );
    const [contact] = await this.users.findStudentContacts([studentId]);

    try {
      return await this.repository.createReservation({
        itemId: item.id,
        clubId: club.id,
        studentId,
        contactPhoneNumber: contact?.user?.phoneNumber ?? "",
        purpose: input.purpose,
        quantity: input.quantity,
        status: "REQUESTED",
        ...duration,
        regularReturnLimitDate: regularLimit,
        clientRequestId: input.clientRequestId,
        requestFingerprint: fingerprint,
        createdAt: now,
        pickupHourId: pickup.id,
        returnHourId: returned.id,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002")
          throw new ConflictException("REQUEST_ID_REUSED");
      }
      throw error;
    }
  }

  @Transactional()
  createItem(input: z.output<typeof apiRentalItemCreate.requestBody>) {
    return this.repository.createItem(input);
  }

  @Transactional<TransactionalAdapterPrisma>(readCommitted)
  async updateItem(
    id: number,
    input: z.output<typeof apiRentalItemUpdate.requestBody>,
  ) {
    const item = await this.lockItem(id);
    if (input.totalQuantity !== undefined) {
      const active = await this.activeReservations(item.id);
      const stillOut =
        item.totalQuantity - physicalQuantity(item.totalQuantity, active);
      const reserved = peakReservedQuantity(
        active,
        rentalDate(this.clock.now()),
      );
      if (input.totalQuantity < Math.max(stillOut, reserved)) {
        throw new ConflictException("STOCK_ALREADY_RESERVED");
      }
    }
    return this.repository.updateItem(id, input);
  }

  @Transactional<TransactionalAdapterPrisma>(readCommitted)
  async approve(id: number, executiveId: number, requestedQuantity?: number) {
    const { row, item } = await this.lockReservation(id);
    const quantity = requestedQuantity ?? row.quantity;
    if (row.status === "RESERVED") {
      if (quantity !== row.quantity)
        throw new ConflictException("INVALID_RENTAL_STATE");
      return row;
    }
    this.requireStatus(row, "REQUESTED");
    if (!validReducedRentalQuantity(quantity, row.quantity))
      throw new BadRequestException("INVALID_RENTAL_QUANTITY");
    const [booked] = await this.schedule.bookedRentals([row]);
    await Promise.all([
      this.schedule.resolveUnchangedBooked(booked.pickup),
      this.schedule.resolveUnchangedBooked(booked.returned),
    ]);
    const active = await this.activeReservations(item.id);
    assertCapacity(
      item.totalQuantity,
      active,
      quantity,
      booked.pickupDate,
      booked.returnDate,
    );
    const requests = await this.repository.listRequestedReservations([item.id]);
    const earlier = requests.filter(request => request.id < row.id);
    const queued = await this.schedule.bookedRentals(earlier);
    const used = peakReservedQuantity(
      [...active, ...queued],
      booked.pickupDate,
      booked.returnDate,
    );
    if (used + quantity > item.totalQuantity) {
      throw new ConflictException("WAITING_FOR_APPROVAL");
    }
    return this.change(row, {
      status: "RESERVED",
      quantity,
      approvedAt: this.clock.now(),
      approvedByExecutiveId: executiveId,
    });
  }

  @Transactional<TransactionalAdapterPrisma>(readCommitted)
  async checkout(
    id: number,
    executiveId: number,
    memo?: string,
    requestedQuantity?: number,
  ) {
    const { row, item } = await this.lockReservation(id);
    const quantity = requestedQuantity ?? row.quantity;
    if (row.status === "CHECKED_OUT") {
      if (quantity !== row.quantity)
        throw new ConflictException("INVALID_RENTAL_STATE");
      return row;
    }
    this.requireStatus(row, "RESERVED");
    if (!validReducedRentalQuantity(quantity, row.quantity))
      throw new BadRequestException("INVALID_RENTAL_QUANTITY");

    const now = this.clock.now();
    const [booked] = await this.schedule.bookedRentals([row]);
    const active = await this.activeReservations(item.id);
    if (checkoutQuantity(item.totalQuantity, active, booked) < quantity) {
      throw new ConflictException("WAITING_FOR_RETURN");
    }
    assertCapacity(
      item.totalQuantity,
      active.filter(reservation => reservation.id !== row.id),
      quantity,
      [booked.pickupDate, rentalDate(now)].sort()[0],
      booked.returnDate,
    );
    return this.change(row, {
      status: "CHECKED_OUT",
      quantity,
      checkedOutAt: now,
      checkedOutByExecutiveId: executiveId,
      checkoutMemo: memo || null,
    });
  }

  @Transactional<TransactionalAdapterPrisma>(readCommitted)
  async confirmReturn(id: number, executiveId: number) {
    const { row } = await this.lockReservation(id);
    if (row.status === "RETURNED") return row;
    this.requireStatus(row, "CHECKED_OUT");
    return this.change(row, {
      status: "RETURNED",
      returnedAt: this.clock.now(),
      returnedByExecutiveId: executiveId,
    });
  }

  @Transactional<TransactionalAdapterPrisma>(readCommitted)
  async close(
    id: number,
    userId: number,
    status: "CANCELLED" | "REJECTED",
    reason?: string,
    studentId?: number,
  ) {
    const { row } = await this.lockReservation(id);
    if (studentId !== undefined) {
      if (row.studentId !== studentId)
        throw new NotFoundException("RENTAL_NOT_FOUND");
    }
    if (row.status === status) return row;
    if (!cancellableRentalStatus(row.status)) {
      throw new ConflictException("INVALID_RENTAL_STATE");
    }
    return this.change(row, {
      status,
      closedAt: this.clock.now(),
      closedByUserId: userId,
      closeReason: reason ?? null,
    });
  }

  @Transactional<TransactionalAdapterPrisma>(readCommitted)
  async reschedule(id: number, input: ScheduleUpdate) {
    const { row, item } = await this.lockReservation(id);
    if (row.status !== "REQUESTED") this.requireActive(row);
    const now = this.clock.now();

    const [booked] = await this.schedule.bookedRentals([row]);
    let { pickup } = booked;
    if (cancellableRentalStatus(row.status)) {
      pickup = input.pickup
        ? await this.schedule.resolve(input.pickup, now)
        : await this.schedule.resolveBooked(pickup, now);
    } else if (input.pickup) {
      throw new ConflictException("PICKUP_ALREADY_CONFIRMED");
    }

    const nextReturn = input.return
      ? await this.schedule.resolve(input.return, now)
      : await this.schedule.resolveBooked(booked.returned, now);
    const duration = zRentalDuration.parse(row);
    let regularLimit = row.regularReturnLimitDate;
    let { approvedExtensionId } = row;
    let returnLimit: string;
    if (pickup.date !== booked.pickupDate) {
      regularLimit = await this.schedule.requireRegularLimit(
        duration,
        pickup.date,
      );
      approvedExtensionId = null;
      returnLimit = regularLimit;
    } else {
      const approval = await this.approvedReturnWindow(row);
      returnLimit = approval?.date ?? regularLimit;
    }
    if (nextReturn.date <= pickup.date)
      throw new BadRequestException("INVALID_RENTAL_PERIOD");
    if (nextReturn.date > returnLimit)
      throw new BadRequestException("INVALID_RENTAL_PERIOD");
    const active = await this.otherReservations(row);
    const from = [pickup.date, rentalDate(now)].sort()[1];
    assertCapacity(
      item.totalQuantity,
      active,
      row.quantity,
      from,
      nextReturn.date,
    );
    return this.change(row, {
      pickupHourId: pickup.id,
      returnHourId: nextReturn.id,
      regularReturnLimitDate: regularLimit,
      approvedExtensionId,
    });
  }

  @Transactional<TransactionalAdapterPrisma>(readCommitted)
  async extend(
    id: number,
    executiveId: number,
    selection: RentalSlotSelection,
    reason: string,
  ) {
    const { row, item } = await this.lockReservation(id);
    this.requireActive(row);
    const now = this.clock.now();

    const [booked] = await this.schedule.bookedRentals([row]);
    if (selection.date === booked.returnDate) {
      const approval = await this.approvedReturnWindow(row);
      if (approval) {
        if (selectionMatches(approval, selection)) return row;
      }
    }
    const nextReturn = await this.schedule.resolve(selection, now);
    if (nextReturn.date <= booked.returnDate)
      throw new BadRequestException("INVALID_EXTENSION");
    if (nextReturn.date <= row.regularReturnLimitDate)
      throw new BadRequestException("INVALID_EXTENSION");
    const days = row.durationType === "DAYS" ? 14 : 7;
    const extensionLimit =
      addRentalDays(row.regularReturnLimitDate, days) ?? "9999-12-31";
    if (nextReturn.date > extensionLimit) {
      throw new BadRequestException("INVALID_EXTENSION");
    }

    const active = await this.otherReservations(row);
    // Extending a loan rechecks the part of the schedule it newly occupies.
    const from = [booked.returnDate, rentalDate(now)].sort()[1];
    assertCapacity(
      item.totalQuantity,
      active,
      row.quantity,
      from,
      nextReturn.date,
    );
    const extension = await this.repository.recordExtension({
      reservationId: id,
      previousReturnHourId: row.returnHourId,
      newReturnHourId: nextReturn.id,
      reason,
      processedByExecutiveId: executiveId,
      processedAt: now,
    });
    return this.change(row, {
      returnHourId: nextReturn.id,
      approvedExtensionId: extension.id,
    });
  }

  private async approvedReturnWindow(row: RentalReservationRow) {
    if (row.approvedExtensionId === null) return null;
    const extension = await this.repository.findExtension(
      row.id,
      row.approvedExtensionId,
    );
    if (!extension) throw new ConflictException("INVALID_RENTAL_STATE");
    const windows = await this.schedule.bookedWindows([
      extension.newReturnHourId,
    ]);
    return requireBookedWindow(windows, extension.newReturnHourId);
  }

  @Transactional()
  private async lockItem(id: number) {
    const item = await this.repository.lockItem(id);
    if (!item) throw new NotFoundException("ITEM_NOT_FOUND");
    return item;
  }

  private async lockReservation(id: number) {
    const existing = await this.repository.findReservation(id);
    if (!existing) throw new NotFoundException("RENTAL_NOT_FOUND");
    const item = await this.lockItem(existing.itemId);
    const row = await this.repository.findReservation(id);
    if (!row) throw new NotFoundException("RENTAL_NOT_FOUND");
    return { row, item };
  }

  private async activeReservations(itemId: number) {
    const reservations = await this.repository.listActiveReservations([itemId]);
    const booked = await this.schedule.bookedRentals(reservations);
    return booked.map(stockWindow);
  }

  private async otherReservations(row: RentalReservationRow) {
    const reservations = await this.activeReservations(row.itemId);
    return reservations.filter(reservation => reservation.id !== row.id);
  }

  private requireStatus(row: RentalReservationRow, status: RentalStatus) {
    if (row.status !== status)
      throw new ConflictException("INVALID_RENTAL_STATE");
  }

  private requireActive(row: RentalReservationRow) {
    if (!activeRentalStatus(zRentalStatus.parse(row.status))) {
      throw new ConflictException("INVALID_RENTAL_STATE");
    }
  }

  @Transactional()
  private async change(
    row: RentalReservationRow,
    data: RentalReservationUpdate,
  ) {
    const updated = await this.repository.changeReservation(
      row.id,
      row.status,
      data,
    );
    if (!updated) throw new ConflictException("INVALID_RENTAL_STATE");
    return updated;
  }
}
