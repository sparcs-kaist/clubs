import { Injectable } from "@nestjs/common";
import { TransactionHost } from "@nestjs-cls/transactional";
import { TransactionalAdapterPrisma } from "@nestjs-cls/transactional-adapter-prisma";
import type { Prisma, RentalReservation } from "@prisma/client";

import type { RentalStatus } from "@clubs/interface/api/rental/v2";

import {
  formatKstDate,
  parseKstDate,
} from "@sparcs-clubs/api/common/util/calendar-date";

type ReturnLimit = { regularReturnLimitDate: string };

export type RentalReservationRow = Omit<RentalReservation, keyof ReturnLimit> &
  ReturnLimit;

type ReservationCreate = Omit<
  Prisma.RentalReservationUncheckedCreateInput,
  keyof ReturnLimit
> &
  ReturnLimit;

export type RentalReservationUpdate = Omit<
  Prisma.RentalReservationUncheckedUpdateManyInput,
  keyof ReturnLimit
> &
  Partial<ReturnLimit>;

function reservationFromDb(row: RentalReservation): RentalReservationRow {
  return {
    ...row,
    regularReturnLimitDate: formatKstDate(row.regularReturnLimitDate),
  };
}

const activeStatuses = ["RESERVED", "CHECKED_OUT"];

@Injectable()
export class RentalRepository {
  constructor(
    private readonly txHost: TransactionHost<TransactionalAdapterPrisma>,
  ) {}

  listItems(includeInactive: boolean) {
    return this.txHost.tx.rentalItem.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: [{ name: "asc" }, { id: "asc" }],
    });
  }

  findItem(id: number) {
    return this.txHost.tx.rentalItem.findUnique({ where: { id } });
  }

  listItemsByIds(ids: number[]) {
    return this.txHost.tx.rentalItem.findMany({ where: { id: { in: ids } } });
  }

  createItem(data: Prisma.RentalItemCreateInput) {
    return this.txHost.tx.rentalItem.create({ data });
  }

  updateItem(id: number, data: Prisma.RentalItemUpdateInput) {
    return this.txHost.tx.rentalItem.update({ where: { id }, data });
  }

  async lockItem(id: number) {
    const result = await this.txHost.tx.rentalItem.updateMany({
      where: { id },
      data: { lockVersion: { increment: 1 } },
    });
    if (result.count === 0) return null;
    return this.findItem(id);
  }

  async findReservation(id: number) {
    const row = await this.txHost.tx.rentalReservation.findUnique({
      where: { id },
    });
    return row ? reservationFromDb(row) : null;
  }

  async findByRequest(studentId: number, clientRequestId: string) {
    const row = await this.txHost.tx.rentalReservation.findUnique({
      where: { studentId_clientRequestId: { studentId, clientRequestId } },
    });
    return row ? reservationFromDb(row) : null;
  }

  async createReservation(data: ReservationCreate) {
    const row = await this.txHost.tx.rentalReservation.create({
      data: {
        ...data,
        regularReturnLimitDate: parseKstDate(data.regularReturnLimitDate),
      },
    });
    return reservationFromDb(row);
  }

  async changeReservation(
    id: number,
    status: string,
    data: RentalReservationUpdate,
  ) {
    const { regularReturnLimitDate } = data;
    const updated = await this.txHost.tx.rentalReservation.updateMany({
      where: { id, status },
      data: {
        ...data,
        regularReturnLimitDate:
          regularReturnLimitDate === undefined
            ? undefined
            : parseKstDate(regularReturnLimitDate),
      },
    });
    if (updated.count !== 1) return null;
    return this.findReservation(id);
  }

  async listActiveReservations(itemIds: number[]) {
    const rows = await this.txHost.tx.rentalReservation.findMany({
      where: { itemId: { in: itemIds }, status: { in: activeStatuses } },
      orderBy: { id: "asc" },
    });
    return rows.map(reservationFromDb);
  }

  listExtensions(reservationId: number) {
    return this.txHost.tx.rentalExtension.findMany({
      where: { reservationId },
      orderBy: { id: "asc" },
    });
  }

  findExtension(reservationId: number, id: number) {
    return this.txHost.tx.rentalExtension.findUnique({
      where: { reservationId_id: { reservationId, id } },
    });
  }

  listExtensionsByIds(ids: number[]) {
    return this.txHost.tx.rentalExtension.findMany({
      where: { id: { in: ids } },
      select: { id: true, newReturnHourId: true },
    });
  }

  recordExtension(data: Prisma.RentalExtensionUncheckedCreateInput) {
    return this.txHost.tx.rentalExtension.create({
      data,
      select: { id: true },
    });
  }

  async listReservations(
    query: {
      pageOffset: number;
      itemCount: number;
      status?: RentalStatus;
      overdue?: "true" | "false";
    },
    {
      officeHourIds,
      overdueReturnHourIds,
    }: {
      officeHourIds?: number[];
      overdueReturnHourIds?: number[];
    },
    studentId?: number,
    clubId?: number,
  ) {
    const where: Prisma.RentalReservationWhereInput = {
      studentId,
      clubId,
      status: query.status,
    };
    const filters: Prisma.RentalReservationWhereInput[] = [];
    if (officeHourIds !== undefined) {
      filters.push({
        OR: [
          { pickupHourId: { in: officeHourIds } },
          { returnHourId: { in: officeHourIds } },
        ],
      });
    }
    const overdue: Prisma.RentalReservationWhereInput = {
      status: "CHECKED_OUT",
      returnHourId: { in: overdueReturnHourIds },
    };
    if (query.overdue === "true") filters.push(overdue);
    if (query.overdue === "false") filters.push({ NOT: overdue });
    where.AND = filters;
    const [items, total] = await Promise.all([
      this.txHost.tx.rentalReservation.findMany({
        where,
        orderBy: { id: officeHourIds === undefined ? "desc" : "asc" },
        skip: (query.pageOffset - 1) * query.itemCount,
        take: query.itemCount,
      }),
      this.txHost.tx.rentalReservation.count({ where }),
    ]);
    return {
      items: items.map(reservationFromDb),
      total,
      offset: query.pageOffset,
    };
  }
}
