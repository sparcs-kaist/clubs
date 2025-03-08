import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { and, gt, isNull, lte } from "drizzle-orm";
import { MySql2Database } from "drizzle-orm/mysql2";

import { DrizzleAsyncProvider } from "@sparcs-clubs/api/drizzle/drizzle.provider";
import { FundingDeadlineD } from "@sparcs-clubs/api/drizzle/schema/semester.schema";

import { MFundingDeadline } from "../model/funding.deadline.model";

@Injectable()
export default class FundingDeadlineRepository {
  constructor(@Inject(DrizzleAsyncProvider) private db: MySql2Database) {}

  /**
   * @param date 날짜를 받습니다.
   * @returns 해당 날짜가 포함된 자금 지원 신청 마감 기한 정보를 리턴합니다.
   */
  async fetch(date: Date): Promise<MFundingDeadline> {
    const result = await this.db
      .select()
      .from(FundingDeadlineD)
      .where(
        and(
          lte(FundingDeadlineD.startDate, date),
          gt(FundingDeadlineD.endDate, date),
          isNull(FundingDeadlineD.deletedAt),
        ),
      );

    if (result.length === 0) {
      throw new NotFoundException("Funding deadline not found");
    }

    return result[0];
  }
}
