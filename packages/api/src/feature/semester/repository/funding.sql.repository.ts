import { Inject, Injectable } from "@nestjs/common";
import { and, eq, gt, isNull, lt, or } from "drizzle-orm";
import { MySql2Database } from "drizzle-orm/mysql2";

import { IntentionalRollback } from "@sparcs-clubs/api/common/util/exception.filter";
import {
  getKSTDate,
  makeObjectPropsFromDBTimezone,
} from "@sparcs-clubs/api/common/util/util";
import { DrizzleAsyncProvider } from "@sparcs-clubs/api/drizzle/drizzle.provider";
import { FundingDeadlineD } from "@sparcs-clubs/api/drizzle/schema/semester.schema";

@Injectable()
export class FundingDeadlineSqlRepository {
  constructor(@Inject(DrizzleAsyncProvider) private db: MySql2Database) {}

  async checkExistingFundingDeadline(
    semesterId: number,
    startTerm: Date,
    endTerm: Date,
  ): Promise<boolean> {
    const existingDeadlines = await this.db
      .select()
      .from(FundingDeadlineD)
      .where(
        and(
          or(
            and(
              gt(FundingDeadlineD.endTerm, startTerm),
              lt(FundingDeadlineD.endTerm, endTerm),
            ),
            and(
              gt(FundingDeadlineD.startTerm, startTerm),
              lt(FundingDeadlineD.startTerm, endTerm),
            ),
            eq(FundingDeadlineD.startTerm, startTerm),
            eq(FundingDeadlineD.endTerm, endTerm),
            and(
              lt(FundingDeadlineD.startTerm, endTerm),
              gt(FundingDeadlineD.endTerm, endTerm),
            ),
            and(
              gt(FundingDeadlineD.startTerm, startTerm),
              lt(FundingDeadlineD.endTerm, startTerm),
            ),
          ),
          eq(FundingDeadlineD.semesterId, semesterId),
          isNull(FundingDeadlineD.deletedAt),
        ),
      );

    return existingDeadlines.length > 0;
  }

  async createFundingDeadline(
    startTerm: Date,
    endTerm: Date,
    deadlineEnum: number,
    semesterId: number,
  ): Promise<boolean> {
    try {
      await this.db.transaction(async tx => {
        const [result] = await tx.insert(FundingDeadlineD).values({
          startTerm,
          endTerm,
          deadlineEnum,
          semesterId,
        });
        if (result.affectedRows === 0) {
          throw new IntentionalRollback();
        }
        return true;
      });
      return true;
    } catch (error) {
      if (error instanceof IntentionalRollback) {
        return false;
      }
      throw error;
    }
  }

  async getFundingDeadlines(semesterId: number) {
    const fundingDeadlines = await this.db
      .select()
      .from(FundingDeadlineD)
      .where(
        and(
          eq(FundingDeadlineD.semesterId, semesterId),
          isNull(FundingDeadlineD.deletedAt),
        ),
      )
      .execute();
    // Date 객체로 변환 (내부 로직용)
    return makeObjectPropsFromDBTimezone(fundingDeadlines);
  }

  async deleteFundingDeadline(deadlineId: number): Promise<boolean> {
    const cur = getKSTDate();
    try {
      await this.db.transaction(async tx => {
        const [result] = await tx
          .update(FundingDeadlineD)
          .set({ deletedAt: cur })
          .where(
            and(
              eq(FundingDeadlineD.id, deadlineId),
              isNull(FundingDeadlineD.deletedAt),
            ),
          );
        if (result.affectedRows === 0) {
          throw new IntentionalRollback();
        }
        return true;
      });
      return true;
    } catch (error) {
      if (error instanceof IntentionalRollback) {
        return false;
      }
      throw error;
    }
  }
}
