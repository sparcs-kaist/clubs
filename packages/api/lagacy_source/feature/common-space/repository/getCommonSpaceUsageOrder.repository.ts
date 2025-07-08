import { Inject, Injectable } from "@nestjs/common";
import { and, between, desc, eq, isNull, or, sql } from "drizzle-orm";
import { MySql2Database } from "drizzle-orm/mysql2";

import type { ApiCms002ResponseOK } from "@clubs/interface/api/common-space/endpoint/apiCms002";

import { DrizzleAsyncProvider } from "@sparcs-clubs/api/drizzle/drizzle.provider";
import { CommonSpaceUsageOrderD } from "@sparcs-clubs/api/drizzle/schema/common-space.schema";
import { Student } from "@sparcs-clubs/api/drizzle/schema/user.schema";

@Injectable()
export class GetCommonSpaceUsageOrderRepository {
  constructor(@Inject(DrizzleAsyncProvider) private db: MySql2Database) {}

  async findBySpaceIdAndStartTermBetweenAndEndTermBetween(
    spaceId: number,
    startDate: Date,
    endTerm: Date,
  ): Promise<ApiCms002ResponseOK> {
    const result = await this.db
      .select({
        orderId: CommonSpaceUsageOrderD.id,
        clubId: CommonSpaceUsageOrderD.clubId,
        chargeStudentName: sql<string>`CONCAT(SUBSTRING(${Student.name}, 1, 1), '*', SUBSTRING(${Student.name}, 3))`,
        startTerm: CommonSpaceUsageOrderD.startTerm,
        endTerm: CommonSpaceUsageOrderD.endTerm,
      })
      .from(CommonSpaceUsageOrderD)
      .leftJoin(Student, eq(CommonSpaceUsageOrderD.chargeStudentId, Student.id))
      .where(
        and(
          eq(CommonSpaceUsageOrderD.commonSpaceId, spaceId),
          or(
            between(CommonSpaceUsageOrderD.startTerm, startDate, endTerm),
            between(CommonSpaceUsageOrderD.endTerm, startDate, endTerm),
          ),
          isNull(CommonSpaceUsageOrderD.deletedAt),
        ),
      )
      .orderBy(desc(CommonSpaceUsageOrderD.startTerm));
    return { usageOrders: result };
  }
}
