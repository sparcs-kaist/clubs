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
  zRentalPeriodPolicy,
  zRentalStatus,
} from "@clubs/interface/api/rental/v2";

import { CLOCK, Clock } from "@sparcs-clubs/api/common/clock/clock";
import ClubPublicService from "@sparcs-clubs/api/feature/club/service/club.public.service";

import {
  RentalRepository,
  type RentalReservationRow,
  type RentalReservationUpdate,
} from "../repository/rental.repository";
import {
  activeRentalStatus,
  addRentalDays,
  checkoutQuantity,
  peakReservedQuantity,
  physicalQuantity,
  type ReservedStock,
} from "./rental-policy";
import {
  pickupKey,
  rentalDate,
  RentalScheduleService,
  returnKey,
} from "./rental-schedule.service";

type CreateRental = z.output<typeof apiRentalCreate.requestBody>;
type ScheduleUpdate = z.output<typeof apiRentalSchedule.requestBody>;

const readCommitted = {
  isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
};

function pickupData(window: RentalSlotSelection) {
  return {
    pickupDate: window.date,
    pickupVersion: window.version,
  };
}

function returnData(window: RentalSlotSelection) {
  return {
    returnDate: window.date,
    returnVersion: window.version,
  };
}

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
      if (existing.requestFingerprint !== fingerprint)
        throw new ConflictException("REQUEST_ID_REUSED");
      return existing;
    }
    if (!item.isActive) throw new NotFoundException("ITEM_NOT_FOUND");

    const now = this.clock.now();
    const policy = zRentalPeriodPolicy.parse(item.durationPolicy);
    if (input.pickup.date >= input.return.date) {
      throw new BadRequestException("INVALID_RENTAL_PERIOD");
    }
    const dates = await this.schedule.availableDates(policy, input.pickup.date);
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

    const active = await this.repository.listActiveReservations([item.id]);
    assertCapacity(
      item.totalQuantity,
      active,
      input.quantity,
      pickup.date,
      returned.date,
    );

    try {
      return await this.repository.createReservation({
        itemId: item.id,
        clubId: club.id,
        studentId,
        contactPhoneNumber: input.contactPhoneNumber,
        purpose: input.purpose,
        quantity: input.quantity,
        status: "RESERVED",
        durationPolicy: policy,
        regularReturnLimitDate: regularLimit,
        clientRequestId: input.clientRequestId,
        requestFingerprint: fingerprint,
        createdAt: now,
        ...pickupData(pickup),
        ...returnData(returned),
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
      const active = await this.repository.listActiveReservations([item.id]);
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
  async checkout(id: number, executiveId: number, memo?: string) {
    const { row, item } = await this.lockReservation(id);
    if (row.status === "CHECKED_OUT") return row;
    this.requireStatus(row, "RESERVED");

    const now = this.clock.now();
    const [pickup] = await Promise.all([
      this.schedule.resolveBooked(pickupKey(row), now),
      this.schedule.resolveBooked(returnKey(row), now),
    ]);
    if (now < pickup.opensAt) throw new ConflictException("PICKUP_NOT_STARTED");
    const active = await this.repository.listActiveReservations([item.id]);
    if (checkoutQuantity(item.totalQuantity, active, row) < row.quantity) {
      throw new ConflictException("WAITING_FOR_RETURN");
    }
    return this.change(row, {
      status: "CHECKED_OUT",
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
    this.requireStatus(row, "RESERVED");
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
    this.requireActive(row);
    const now = this.clock.now();

    let pickup = pickupKey(row);
    if (row.status === "RESERVED") {
      pickup = input.pickup
        ? await this.schedule.resolve(input.pickup, now)
        : await this.schedule.resolveBooked(pickup, now);
    } else if (input.pickup) {
      throw new ConflictException("PICKUP_ALREADY_CONFIRMED");
    }

    const nextReturn = input.return
      ? await this.schedule.resolve(input.return, now)
      : await this.schedule.resolveBooked(returnKey(row), now);
    const policy = zRentalPeriodPolicy.parse(row.durationPolicy);
    let regularLimit = row.regularReturnLimitDate;
    let { approvedExtensionId } = row;
    let returnLimit: string;
    if (pickup.date !== row.pickupDate) {
      regularLimit = await this.schedule.requireRegularLimit(
        policy,
        pickup.date,
      );
      approvedExtensionId = null;
      returnLimit = regularLimit;
    } else {
      const approval = await this.findApprovedExtension(row);
      returnLimit = approval?.newReturnDate ?? regularLimit;
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
      ...pickupData(pickup),
      ...returnData(nextReturn),
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

    if (selection.date === row.returnDate) {
      const approval = await this.findApprovedExtension(row);
      if (approval?.newReturnDate === selection.date) {
        if (approval.newReturnVersion === selection.version) return row;
      }
    }
    const nextReturn = await this.schedule.resolve(selection, now);
    if (nextReturn.date <= row.returnDate)
      throw new BadRequestException("INVALID_EXTENSION");
    if (nextReturn.date <= row.regularReturnLimitDate)
      throw new BadRequestException("INVALID_EXTENSION");
    const days = row.durationPolicy === "DAYS_14" ? 14 : 7;
    if (nextReturn.date > addRentalDays(row.regularReturnLimitDate, days)) {
      throw new BadRequestException("INVALID_EXTENSION");
    }

    const active = await this.otherReservations(row);
    // Extending a loan rechecks the part of the schedule it newly occupies.
    const from = [row.returnDate, rentalDate(now)].sort()[1];
    assertCapacity(
      item.totalQuantity,
      active,
      row.quantity,
      from,
      nextReturn.date,
    );
    const extension = await this.repository.recordExtension({
      reservationId: id,
      previousReturnDate: row.returnDate,
      previousReturnVersion: row.returnVersion,
      newReturnDate: nextReturn.date,
      newReturnVersion: nextReturn.version,
      reason,
      processedByExecutiveId: executiveId,
      processedAt: now,
    });
    return this.change(row, {
      ...returnData(nextReturn),
      approvedExtensionId: extension.id,
    });
  }

  private async findApprovedExtension(row: RentalReservationRow) {
    if (row.approvedExtensionId === null) return null;
    const extension = await this.repository.findExtension(
      row.id,
      row.approvedExtensionId,
    );
    if (!extension) throw new ConflictException("INVALID_RENTAL_STATE");
    return extension;
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

  private async otherReservations(row: RentalReservationRow) {
    const reservations = await this.repository.listActiveReservations([
      row.itemId,
    ]);
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
