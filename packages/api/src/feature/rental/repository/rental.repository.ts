import { Injectable } from "@nestjs/common";
import { TransactionHost } from "@nestjs-cls/transactional";
import { TransactionalAdapterPrisma } from "@nestjs-cls/transactional-adapter-prisma";
import type { Prisma } from "@prisma/client";

import type { RentalStatus } from "@clubs/interface/api/rental/v2";

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

  findReservation(id: number) {
    return this.txHost.tx.rentalReservation.findUnique({ where: { id } });
  }

  findByRequest(studentId: number, clientRequestId: string) {
    return this.txHost.tx.rentalReservation.findUnique({
      where: { studentId_clientRequestId: { studentId, clientRequestId } },
    });
  }

  createReservation(data: Prisma.RentalReservationUncheckedCreateInput) {
    return this.txHost.tx.rentalReservation.create({ data });
  }

  async changeReservation(
    id: number,
    status: string,
    data: Prisma.RentalReservationUncheckedUpdateManyInput,
  ) {
    const updated = await this.txHost.tx.rentalReservation.updateMany({
      where: { id, status },
      data,
    });
    if (updated.count !== 1) return null;
    return this.findReservation(id);
  }

  listActiveReservations(itemIds: number[]) {
    return this.txHost.tx.rentalReservation.findMany({
      where: { itemId: { in: itemIds }, status: { in: activeStatuses } },
      orderBy: { id: "asc" },
    });
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
      select: { id: true, newReturnDate: true },
    });
  }

  recordExtension(data: Prisma.RentalExtensionUncheckedCreateInput) {
    return this.txHost.tx.rentalExtension.create({ data });
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
      filters.push({
        OR: [
          { pickupDate: query.officeDate },
          { returnDate: query.officeDate },
        ],
      });
    }
    const overdue = {
      status: "CHECKED_OUT",
      OR: [
        { returnDate: { lt: today } },
        { returnDate: today, returnVersion: { in: elapsedVersions } },
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
    return { items, total, offset: query.pageOffset };
  }
}
