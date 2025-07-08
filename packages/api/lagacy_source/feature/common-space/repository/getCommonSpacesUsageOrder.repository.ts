import { Inject, Injectable } from "@nestjs/common";
import { and, between, desc, eq, isNull, or } from "drizzle-orm";
import { MySql2Database } from "drizzle-orm/mysql2";

import type { ApiCms006ResponseOk } from "@clubs/interface/api/common-space/endpoint/apiCms006";

import { DrizzleAsyncProvider } from "@sparcs-clubs/api/drizzle/drizzle.provider";
import {
  CommonSpace,
  CommonSpaceUsageOrderD,
} from "@sparcs-clubs/api/drizzle/schema/common-space.schema";
import { Student } from "@sparcs-clubs/api/drizzle/schema/user.schema";

@Injectable()
export class GetCommonSpacesUsageOrderRepository {
  constructor(@Inject(DrizzleAsyncProvider) private db: MySql2Database) {}

  async getStudentCommonSpacesUsageOrder(
    clubId: number,
    startDate: Date,
    endTerm: Date,
    offset: number,
    total: number,
  ): Promise<ApiCms006ResponseOk> {
    const sq = this.db
      .select({
        createdAt: CommonSpaceUsageOrderD.createdAt,
        orderId: CommonSpaceUsageOrderD.id,
        commonSpaceId: CommonSpaceUsageOrderD.commonSpaceId,
        chargeStudentId: CommonSpaceUsageOrderD.chargeStudentId,
        startTerm: CommonSpaceUsageOrderD.startTerm,
        endTerm: CommonSpaceUsageOrderD.endTerm,
      })
      .from(CommonSpaceUsageOrderD)
      .where(
        and(
          eq(CommonSpaceUsageOrderD.clubId, clubId),
          or(
            between(CommonSpaceUsageOrderD.startTerm, startDate, endTerm),
            between(CommonSpaceUsageOrderD.endTerm, startDate, endTerm),
          ),
          isNull(CommonSpaceUsageOrderD.deletedAt),
        ),
      )
      .as("sq");

    const rows = await this.db
      .select({
        createdAt: sq.createdAt,
        orderId: sq.orderId,
        statusEnum: CommonSpace.commonSpaceEnum,
        spaceName: CommonSpace.spaceName,
        chargeStudentName: Student.name,
        startTerm: sq.startTerm,
        endTerm: sq.endTerm,
      })
      .from(sq)
      .leftJoin(CommonSpace, eq(sq.commonSpaceId, CommonSpace.id))
      .leftJoin(Student, eq(sq.chargeStudentId, Student.id))
      .orderBy(desc(sq.startTerm))
      .offset(offset * total)
      .limit(total);

    const result = {
      total,
      items: rows,
      offset,
    };
    return result;
  }
}
