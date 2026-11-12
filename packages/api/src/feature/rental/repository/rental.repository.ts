import { Injectable } from "@nestjs/common";
import { TransactionHost } from "@nestjs-cls/transactional";
import { TransactionalAdapterPrisma } from "@nestjs-cls/transactional-adapter-prisma";
import type {
  Prisma,
  RentalExtension,
  RentalReservation,
} from "@prisma/client";

import type { RentalStatus } from "@clubs/interface/api/rental/v2";

import {
  formatKstDate,
  parseKstDate,
} from "@sparcs-clubs/api/common/util/calendar-date";

type ReservationDates = {
  pickupDate: string;
  returnDate: string;
  regularReturnLimitDate: string;
};

export type RentalReservationRow = Omit<
  RentalReservation,
  keyof ReservationDates
> &
  ReservationDates;

type ReservationCreate = Omit<
  Prisma.RentalReservationUncheckedCreateInput,
  keyof ReservationDates
> &
  ReservationDates;

export type RentalReservationUpdate = Omit<
  Prisma.RentalReservationUncheckedUpdateManyInput,
  keyof ReservationDates
> &
  Partial<ReservationDates>;

type ExtensionDates = {
  previousReturnDate: string;
  newReturnDate: string;
};

type ExtensionCreate = Omit<
  Prisma.RentalExtensionUncheckedCreateInput,
  keyof ExtensionDates
> &
  ExtensionDates;

function reservationFromDb(row: RentalReservation): RentalReservationRow {
  return {
    ...row,
    pickupDate: formatKstDate(row.pickupDate),
    returnDate: formatKstDate(row.returnDate),
    regularReturnLimitDate: formatKstDate(row.regularReturnLimitDate),
  };
}

function extensionFromDb(row: RentalExtension) {
  return {
    ...row,
    previousReturnDate: formatKstDate(row.previousReturnDate),
    newReturnDate: formatKstDate(row.newReturnDate),
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
        pickupDate: parseKstDate(data.pickupDate),
        returnDate: parseKstDate(data.returnDate),
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
    const { pickupDate, returnDate, regularReturnLimitDate } = data;
    const updated = await this.txHost.tx.rentalReservation.updateMany({
      where: { id, status },
      data: {
        ...data,
        pickupDate:
          pickupDate === undefined ? undefined : parseKstDate(pickupDate),
        returnDate:
          returnDate === undefined ? undefined : parseKstDate(returnDate),
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

  async listExtensions(reservationId: number) {
    const rows = await this.txHost.tx.rentalExtension.findMany({
      where: { reservationId },
      orderBy: { id: "asc" },
    });
    return rows.map(extensionFromDb);
  }

  async findExtension(reservationId: number, id: number) {
    const row = await this.txHost.tx.rentalExtension.findUnique({
      where: { reservationId_id: { reservationId, id } },
    });
    return row ? extensionFromDb(row) : null;
  }

  async listExtensionsByIds(ids: number[]) {
    const rows = await this.txHost.tx.rentalExtension.findMany({
      where: { id: { in: ids } },
      select: { id: true, newReturnDate: true },
    });
    return rows.map(({ id, newReturnDate }) => ({
      id,
      newReturnDate: formatKstDate(newReturnDate),
    }));
  }

  recordExtension(data: ExtensionCreate) {
    return this.txHost.tx.rentalExtension.create({
      data: {
        ...data,
        previousReturnDate: parseKstDate(data.previousReturnDate),
        newReturnDate: parseKstDate(data.newReturnDate),
      },
      select: { id: true },
    });
  }

  async listReservations(
    query: {
      pageOffset: number;
      itemCount: number;
      status?: RentalStatus;
      officeDate?: string;
      overdue?: "true" | "false";
    },
    today: string,
    elapsedVersions: number[],
    studentId?: number,
  ) {
    const where: Prisma.RentalReservationWhereInput = {
      studentId,
      status: query.status,
    };
    const filters: Prisma.RentalReservationWhereInput[] = [];
    if (query.officeDate) {
      const date = parseKstDate(query.officeDate);
      filters.push({ OR: [{ pickupDate: date }, { returnDate: date }] });
    }
    const currentDate = parseKstDate(today);
    const overdue = {
      status: "CHECKED_OUT",
      OR: [
        { returnDate: { lt: currentDate } },
        { returnDate: currentDate, returnVersion: { in: elapsedVersions } },
      ],
    };
    if (query.overdue === "true") filters.push(overdue);
    if (query.overdue === "false") filters.push({ NOT: overdue });
    where.AND = filters;
    const [items, total] = await Promise.all([
      this.txHost.tx.rentalReservation.findMany({
        where,
        orderBy: { id: query.officeDate === undefined ? "desc" : "asc" },
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
