import { Inject, Injectable } from "@nestjs/common";
import { and, count, eq, gt, isNull, lt, or } from "drizzle-orm";
import { MySql2Database } from "drizzle-orm/mysql2";

import { DrizzleAsyncProvider } from "@sparcs-clubs/api/drizzle/drizzle.provider";
import {
  RentalEnum,
  RentalObject,
  RentalOrder,
  RentalOrderItemD,
} from "@sparcs-clubs/api/drizzle/schema/rental.schema";

@Injectable()
export class RentalObjectRepository {
  constructor(@Inject(DrizzleAsyncProvider) private db: MySql2Database) {}

  // desiredStart, desiredEnd 사이에 사용 가능한 물품들을  (objectEnum id, enum name, maximum)[] 형태로 변환
  async getAvailableRentals(desiredStart: Date, desiredEnd: Date) {
    const availableObjects = await this.db
      .select({
        id: RentalObject.rentalEnum,
        name: RentalEnum.typeName,
        maximum: count(RentalObject.id),
      })
      .from(RentalObject)
      .leftJoin(
        RentalOrderItemD,
        eq(RentalOrderItemD.objectId, RentalObject.id),
      )
      .leftJoin(RentalOrder, eq(RentalOrder.id, RentalOrderItemD.rentalOrderId))
      .leftJoin(RentalEnum, eq(RentalObject.rentalEnum, RentalEnum.id))
      .where(
        and(
          or(
            or(
              isNull(RentalOrder.desiredStart),
              gt(RentalOrder.desiredStart, desiredEnd),
            ),
            RentalOrderItemD.endTerm
              ? lt(RentalOrderItemD.endTerm, desiredStart)
              : RentalOrder.desiredEnd &&
                  lt(RentalOrder.desiredEnd, desiredStart),
          ),
          isNull(RentalOrder.deletedAt),
          isNull(RentalObject.deletedAt),
        ),
      )
      .groupBy(RentalObject.rentalEnum);
    return availableObjects;
  }
}
