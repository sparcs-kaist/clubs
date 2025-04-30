import { Inject, Injectable } from "@nestjs/common";
import { and, count, desc, eq, gte, lte } from "drizzle-orm";
import { MySql2Database } from "drizzle-orm/mysql2";

import { PromotionalPrintingOrderStatusEnum as Status } from "@clubs/interface/common/enum/promotionalPrinting.enum";

import logger from "@sparcs-clubs/api/common/util/logger";
import { DrizzleAsyncProvider } from "@sparcs-clubs/api/drizzle/drizzle.provider";
import {
  PromotionalPrintingOrder,
  PromotionalPrintingOrderSize,
} from "@sparcs-clubs/api/drizzle/schema/promotional-printing.schema";
import { Student } from "@sparcs-clubs/api/drizzle/schema/user.schema";

import type {
  GetStudentPromotionalPrintingsOrdersMyReturn,
  GetStudentPromotionalPrintingsOrdersReturn,
  PostStudentPromotionalPrintingsOrderParam,
} from "../dto/promotional-printing.dto";

@Injectable()
export class PromotionalPrintingOrderRepository {
  constructor(@Inject(DrizzleAsyncProvider) private db: MySql2Database) {}

  async countByStudentIdAndCreatedAtIn(
    studentId: number,
    startDate?: Date,
    endTerm?: Date,
  ): Promise<number> {
    const numberOfOrders = (
      await this.db
        .select({ count: count() })
        .from(PromotionalPrintingOrder)
        .where(
          and(
            eq(PromotionalPrintingOrder.studentId, studentId),
            startDate !== undefined
              ? gte(PromotionalPrintingOrder.createdAt, startDate)
              : undefined,
            endTerm !== undefined
              ? lte(PromotionalPrintingOrder.createdAt, endTerm)
              : undefined,
          ),
        )
    ).at(0).count;

    return numberOfOrders;
  }

  async countByCreatedAtIn(startDate?: Date, endTerm?: Date): Promise<number> {
    const numberOfOrders = (
      await this.db
        .select({ count: count() })
        .from(PromotionalPrintingOrder)
        .where(
          and(
            startDate !== undefined
              ? gte(PromotionalPrintingOrder.createdAt, startDate)
              : undefined,
            endTerm !== undefined
              ? lte(PromotionalPrintingOrder.createdAt, endTerm)
              : undefined,
          ),
        )
    ).at(0).count;

    return numberOfOrders;
  }

  async findByOrderId(orderId: number) {
    const orders = await this.db
      .select()
      .from(PromotionalPrintingOrder)
      .where(eq(PromotionalPrintingOrder.id, orderId));

    return orders;
  }

  async getStudentPromotionalPrintingsOrders(
    clubId: number,
    pageOffset: number,
    itemCount: number,
    startDate?: Date,
    endTerm?: Date,
  ): Promise<GetStudentPromotionalPrintingsOrdersReturn> {
    const startIndex = (pageOffset - 1) * itemCount + 1;
    const orders = await this.db
      .select({
        id: PromotionalPrintingOrder.id,
        studentName: Student.name,
        status: PromotionalPrintingOrder.promotionalPrintingOrderStatusEnum,
        desiredPickUpDate: PromotionalPrintingOrder.desiredPickUpTime,
        pickUpTime: PromotionalPrintingOrder.pickUpAt,
        createdAt: PromotionalPrintingOrder.createdAt,
      })
      .from(PromotionalPrintingOrder)
      .leftJoin(Student, eq(PromotionalPrintingOrder.studentId, Student.id))
      .where(
        and(
          eq(PromotionalPrintingOrder.clubId, clubId),
          startDate !== undefined
            ? gte(PromotionalPrintingOrder.createdAt, startDate)
            : undefined,
          endTerm !== undefined
            ? lte(PromotionalPrintingOrder.createdAt, endTerm)
            : undefined,
        ),
      )
      .orderBy(desc(PromotionalPrintingOrder.createdAt))
      .limit(itemCount)
      .offset(startIndex - 1);

    return orders;
  }

  async postStudentPromotionalPrintingsOrder(
    parameter: PostStudentPromotionalPrintingsOrderParam,
  ) {
    // 트랜잭션에 실패했을 경우의 에러 핸들링을 어떻게 하는것이 좋을까요?
    await this.db.transaction(async tx => {
      const [orderInsertResult] = await tx
        .insert(PromotionalPrintingOrder)
        .values({
          clubId: parameter.clubId,
          // 아직 인증 구현이 안되어서 임의의값을 집어넣은 상태입니다(하승종 Id)
          studentId: 605,
          studentPhoneNumber: parameter.krPhoneNumber,
          promotionalPrintingOrderStatusEnum: Status.Applied,
          documentFileLink: parameter.documentFileLink,
          isColorPrint: parameter.isColorPrint,
          fitPrintSizeToPaper: parameter.fitPrintSizeToPaper,
          requireMarginChopping: parameter.requireMarginChopping,
          desiredPickUpTime: parameter.desiredPickUpTime,
        });
      if (orderInsertResult.affectedRows !== 1) {
        logger.debug("[postStudentPromotionalPrintingsOrder] rollback occurs");
        tx.rollback();
      }

      logger.debug(
        `[postStudentPromotionalPrintingsOrder] PromotionalPrintingOrder inserted with id ${orderInsertResult.insertId}`,
      );

      parameter.orders.forEach(async order => {
        const [sizeInsertResult] = await tx
          .insert(PromotionalPrintingOrderSize)
          .values({
            promotionalPrintingOrderId: orderInsertResult.insertId,
            promotionalPrintingSizeEnumId: order.promotionalPrintingSizeEnum,
            numberOfPrints: order.numberOfPrints,
          });
        if (sizeInsertResult.affectedRows !== 1) {
          logger.debug(
            "[postStudentPromotionalPrintingsOrder] rollback occurs",
          );
          tx.rollback();
        }
      });
    });
    logger.debug(
      "[postStudentPromotionalPrintingsOrder] insertion ends successfully",
    );

    return {};
  }

  async getStudentPromotionalPrintingsOrdersMy(
    studentId: number,
    pageOffset: number,
    itemCount: number,
    startDate?: Date,
    endTerm?: Date,
  ): Promise<GetStudentPromotionalPrintingsOrdersMyReturn> {
    const startIndex = (pageOffset - 1) * itemCount + 1;
    const orders = await this.db
      .select({
        id: PromotionalPrintingOrder.id,
        studentName: Student.name,
        status: PromotionalPrintingOrder.promotionalPrintingOrderStatusEnum,
        desiredPickUpDate: PromotionalPrintingOrder.desiredPickUpTime,
        pickUpTime: PromotionalPrintingOrder.pickUpAt,
        createdAt: PromotionalPrintingOrder.createdAt,
      })
      .from(PromotionalPrintingOrder)
      .leftJoin(Student, eq(PromotionalPrintingOrder.studentId, Student.id))
      .where(
        and(
          eq(PromotionalPrintingOrder.studentId, studentId),
          startDate !== undefined
            ? gte(PromotionalPrintingOrder.createdAt, startDate)
            : undefined,
          endTerm !== undefined
            ? lte(PromotionalPrintingOrder.createdAt, endTerm)
            : undefined,
        ),
      )
      .orderBy(desc(PromotionalPrintingOrder.createdAt))
      .limit(itemCount)
      .offset(startIndex - 1);

    return orders;
  }
}
