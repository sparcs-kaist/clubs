import { Inject, Injectable } from "@nestjs/common";
import { and, count, eq, gte, isNull, lte } from "drizzle-orm";
import { MySql2Database } from "drizzle-orm/mysql2";

import { RentalOrderStatusEnum } from "@clubs/interface/common/enum/rental.enum";

import { DrizzleAsyncProvider } from "@sparcs-clubs/api/drizzle/drizzle.provider";
import { ClubOld } from "@sparcs-clubs/api/drizzle/schema/club.schema";
import {
  RentalEnum,
  RentalObject,
  RentalOrder,
  RentalOrderItemD,
} from "@sparcs-clubs/api/drizzle/schema/rental.schema";
import { Student } from "@sparcs-clubs/api/drizzle/schema/user.schema";

interface Period {
  desiredStart?: Date;
  desiredEnd?: Date;
  startTerm?: Date;
  endTerm?: Date;
}
@Injectable()
export class RentalServiceRepository {
  constructor(@Inject(DrizzleAsyncProvider) private db: MySql2Database) {}

  // 내부 util 함수,  대여 주문의 상태를 가져옵니다.
  private getRentalOrderStatus(
    desiredStart: Date,
    desiredEnd: Date,
    startTerm?: Date,
    endTerm?: Date,
  ): RentalOrderStatusEnum {
    const today = new Date();
    if (!startTerm && today < desiredStart) {
      return RentalOrderStatusEnum.Applied; // 신청
    }
    if (startTerm && today < startTerm) {
      return RentalOrderStatusEnum.Approved; // 승인
    }
    if (startTerm && !endTerm && desiredStart <= today && today <= desiredEnd) {
      return RentalOrderStatusEnum.Rented; // 대여중
    }
    if (!endTerm) {
      return RentalOrderStatusEnum.Returned; // 반납
    }
    return RentalOrderStatusEnum.Overdue; //
  }

  // 내부 util 함수, 어떤 order에 대해, 그에 해당하는 object들의 종류와 개수를 가져옵니다.
  private async getOrderObjects(orderId) {
    const objects = await this.db
      .select({
        id: RentalEnum.id,
        name: RentalEnum.typeName,
        number: count(RentalObject.id),
      })
      .from(RentalOrderItemD)
      .leftJoin(RentalObject, eq(RentalOrderItemD.objectId, RentalObject.id))
      .leftJoin(RentalEnum, eq(RentalObject.rentalEnum, RentalEnum.id))
      .groupBy(RentalObject.rentalEnum)
      .where(eq(RentalOrderItemD.rentalOrderId, orderId));

    return objects;
  }

  // 내부 util 함수, pagination을 수행합니다.
  private paginate(items, page: number, pageSize: number) {
    const startIndex = (page - 1) * pageSize;
    const total = items.length;
    const paginatedItems = items.slice(startIndex, startIndex + pageSize);
    return {
      paginatedItems,
      total,
    };
  }

  // 내부 util 함수 대여하고자 하는 물건들의 종류에 대해 비동기 작업을 병렬로 수행
  private async getAvailableObjects(objects, desiredStart, desiredEnd) {
    const matchingObjects = await Promise.all(
      objects.map(async obj => {
        const results = await this.db
          .select({
            rentalEnumId: RentalObject.rentalEnum,
            objectId: RentalObject.id,
            desiredStart: RentalOrder.desiredStart,
            desiredEnd: RentalOrder.desiredEnd,
            endTerm: RentalOrderItemD.endTerm,
            orderId: RentalOrderItemD.rentalOrderId,
            startTerm: RentalOrderItemD.startTerm,
          })
          .from(RentalObject)
          .leftJoin(
            RentalOrderItemD,
            eq(RentalObject.id, RentalOrderItemD.objectId),
          )
          .leftJoin(
            RentalOrder,
            eq(RentalOrderItemD.rentalOrderId, RentalOrder.id),
          )
          .where(
            and(
              eq(RentalObject.rentalEnum, obj.id), // rentalEnum이 obj.rentalEnumId와 같은 조건
              isNull(RentalOrder.deletedAt),
              isNull(RentalObject.deletedAt),
            ),
          );

        const groupedByObjectId = results.reduce<Record<number, Period[]>>(
          (acc, curr) => {
            if (!acc[curr.objectId]) {
              acc[curr.objectId] = [];
            }
            acc[curr.objectId].push({
              desiredStart: curr.desiredStart,
              desiredEnd: curr.desiredEnd,
              startTerm: curr.startTerm,
              endTerm: curr.endTerm,
            });
            return acc;
          },
          {},
        );

        const availableObjectIds = Object.entries(groupedByObjectId).reduce(
          (acc, [objectId, periods]) => {
            const isAvailable = periods.every(
              result =>
                result.desiredStart > desiredEnd ||
                (result.endTerm
                  ? result.endTerm < desiredStart
                  : result.desiredEnd < desiredStart),
            );

            if (isAvailable) {
              acc.push(Number(objectId));
            }
            return acc;
          },
          [],
        );

        // 결과의 개수가 obj.number보다 적은 경우 false 반환
        if (availableObjectIds.length < obj.number) {
          return false;
        }

        const availableIds = {
          rentalEnumId: obj.id,
          objectId: availableObjectIds.slice(0, obj.number),
        };

        return availableIds;
      }),
    );

    // 2차원 배열을 1차원 배열로 평탄화
    return matchingObjects.flat();
  }

  async createRental(
    studentId,
    clubId,
    objects,
    purpose,
    desiredStart,
    desiredEnd,
    studentPhoneNumber,
  ) {
    const availableObjects = await this.getAvailableObjects(
      objects,
      desiredStart,
      desiredEnd,
    );

    // request의 object 들 중 사용 가능하지 않은 것이 하나라도 있는 경우 오류 발생
    if (availableObjects.includes(false)) {
      return false;
    }
    const result = await this.db.transaction(async tx => {
      // RentalOrder에 삽입
      const [orderInsertResult] = await tx.insert(RentalOrder).values({
        studentId,
        clubId,
        studentPhoneNumber,
        purpose,
        desiredStart,
        desiredEnd,
      });

      const rentalOrderId = orderInsertResult.insertId;

      // RentalOrderItemD에 매칭되는 객체 삽입
      await Promise.all(
        availableObjects.map(async obj => {
          await tx.insert(RentalOrderItemD).values({
            rentalOrderId,
            objectId: obj.objectId,
          });
        }),
      );
      return true;
    });
    return result;
  }

  async getRentals(clubId, page, pageSize, startDate?: Date, endTerm?: Date) {
    const orders = await this.db
      .select({
        id: RentalOrder.id,
        studentName: Student.name,
        studentPhoneNumber: RentalOrder.studentPhoneNumber,
        startTerm: RentalOrderItemD.startTerm,
        endTerm: RentalOrderItemD.endTerm,
        createdAt: RentalOrder.createdAt,
        desiredStart: RentalOrder.desiredStart,
        desiredEnd: RentalOrder.desiredEnd,
      })
      .from(RentalOrder)
      .leftJoin(
        RentalOrderItemD,
        eq(RentalOrderItemD.rentalOrderId, RentalOrder.id),
      )
      .leftJoin(Student, eq(Student.id, RentalOrder.studentId))
      .where(
        and(
          eq(RentalOrder.clubId, clubId),
          startDate && gte(RentalOrder.desiredStart, startDate),
          endTerm && lte(RentalOrder.desiredEnd, endTerm),
        ),
      )
      .groupBy(
        RentalOrder.id,
        RentalOrderItemD.startTerm,
        RentalOrderItemD.endTerm,
      );

    // 각 주문 건에 대해서 1)물건 종류와 수 2)주문 상태를 가져옵니다.
    const orderObjects = await Promise.all(
      orders.map(async order => {
        const objects = await this.getOrderObjects(order.id);
        const statusEnum = this.getRentalOrderStatus(
          order.desiredStart,
          order.desiredEnd,
          order.startTerm,
          order.endTerm,
        );
        return { ...order, objects, statusEnum };
      }),
    );
    return this.paginate(orderObjects, page, pageSize);
  }

  // startTerm 와 endTerm 사이에 해당하는 나의 대여 목록을 가져옵니다.
  // 같은 rental Order id 여도 startTerm, endTerm 이 다르면 status 가 다를 수 있으므로, 별개의 row 로 가져옵니다.
  async getRentalsMy(
    page: number,
    pageSize: number,
    startDate?: Date,
    endTerm?: Date,
  ) {
    const myOrders = await this.db
      .select({
        id: RentalOrder.id,
        studentName: Student.name,
        purpose: RentalOrder.purpose,
        desiredStart: RentalOrder.desiredStart,
        desiredEnd: RentalOrder.desiredEnd,
        startTerm: RentalOrderItemD.startTerm,
        endTerm: RentalOrderItemD.endTerm,
        createdAt: RentalOrder.createdAt,
      })
      .from(RentalOrder)
      .leftJoin(Student, eq(RentalOrder.studentId, Student.id))
      .leftJoin(ClubOld, eq(RentalOrder.clubId, ClubOld.id))
      .leftJoin(
        RentalOrderItemD,
        eq(RentalOrder.id, RentalOrderItemD.rentalOrderId),
      )
      .groupBy(
        RentalOrder.id,
        RentalOrderItemD.startTerm,
        RentalOrderItemD.endTerm,
      )
      .where(
        and(
          eq(RentalOrder.studentId, 1),
          startDate && gte(RentalOrder.desiredStart, startDate),
          endTerm && lte(RentalOrder.desiredEnd, endTerm),
        ),
      );

    // order 별로 object 정보 (enum, number)[] 가져오기, status Enum 설정하기
    const myOrdersObjects = await Promise.all(
      myOrders.map(async order => {
        const objects = await this.getOrderObjects(order.id);
        const statusEnum = this.getRentalOrderStatus(
          order.desiredStart,
          order.desiredEnd,
          order.startTerm,
          order.endTerm,
        );
        return { ...order, objects, statusEnum };
      }),
    );
    return this.paginate(myOrdersObjects, page, pageSize);
  }
}
