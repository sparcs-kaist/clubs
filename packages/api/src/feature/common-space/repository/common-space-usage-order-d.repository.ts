import { Inject, Injectable } from "@nestjs/common";
import { and, between, eq, isNull, or, sql } from "drizzle-orm";
import { MySql2Database } from "drizzle-orm/mysql2";

import type { ApiCms003ResponseCreated } from "@clubs/interface/api/common-space/endpoint/apiCms003";
import type { ApiCms005ResponseCreated } from "@clubs/interface/api/common-space/endpoint/apiCms005";

import { takeOne } from "@sparcs-clubs/api/common/util/util";
import { DrizzleAsyncProvider } from "@sparcs-clubs/api/drizzle/drizzle.provider";
import { CommonSpaceUsageOrderD } from "@sparcs-clubs/api/drizzle/schema/common-space.schema";

import { TermList } from "../dto/common-space.dto";

@Injectable()
export class CommonSpaceUsageOrderDRepository {
  constructor(@Inject(DrizzleAsyncProvider) private db: MySql2Database) {}

  async setCommonSpaceUsageOrderD(
    commonSpaceId: number,
    clubId: number,
    chargeStudentId: number,
    studentPhoneNumber: string,
    startTerm: Date,
    endTerm: Date,
  ): Promise<ApiCms003ResponseCreated> {
    await this.db.insert(CommonSpaceUsageOrderD).values({
      commonSpaceId,
      clubId,
      chargeStudentId,
      studentPhoneNumber,
      startTerm,
      endTerm,
    });
    return {};
  }

  async setManyCommonSpaceUsageOrderD(
    insertValue: TermList[],
  ): Promise<ApiCms005ResponseCreated> {
    await this.db.insert(CommonSpaceUsageOrderD).values(insertValue);
    return {};
  }

  async findBySpaceIdAndClubIdAndStartTermBetweenAndEndTermBetween(
    spaceId: number,
    clubId: number,
    startDate: Date,
    endTerm: Date,
  ) {
    const result = await this.db
      .select({
        start: CommonSpaceUsageOrderD.startTerm,
        end: CommonSpaceUsageOrderD.endTerm,
      })
      .from(CommonSpaceUsageOrderD)
      .where(
        and(
          eq(CommonSpaceUsageOrderD.commonSpaceId, spaceId),
          eq(CommonSpaceUsageOrderD.clubId, clubId),
          or(
            between(CommonSpaceUsageOrderD.startTerm, startDate, endTerm),
            between(CommonSpaceUsageOrderD.endTerm, startDate, endTerm),
          ),
          isNull(CommonSpaceUsageOrderD.deletedAt),
        ),
      );
    return result;
  }

  async findCommonSpaceUsageOrderByIdAndSpaceId(
    orderId: number,
    spaceId: number,
  ) {
    const result = await this.db
      .select()
      .from(CommonSpaceUsageOrderD)
      .where(
        and(
          eq(CommonSpaceUsageOrderD.id, orderId),
          eq(CommonSpaceUsageOrderD.commonSpaceId, spaceId),
          isNull(CommonSpaceUsageOrderD.deletedAt),
        ),
      )
      .then(takeOne);
    return result;
  }

  async deleteCommonSpaceUsageOrderD(orderId: number) {
    await this.db
      .update(CommonSpaceUsageOrderD)
      .set({ deletedAt: sql<Date>`NOW()` })
      .where(eq(CommonSpaceUsageOrderD.id, orderId));
    return {};
  }
}
