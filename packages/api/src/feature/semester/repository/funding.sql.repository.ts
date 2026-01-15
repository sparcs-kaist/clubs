import { Inject, Injectable } from "@nestjs/common";
import { and, eq, gt, isNull, lt, or, sql } from "drizzle-orm";
import { MySql2Database } from "drizzle-orm/mysql2";

import { IntentionalRollback } from "@sparcs-clubs/api/common/util/exception.filter";
import { getKSTDate } from "@sparcs-clubs/api/common/util/util";
import { DrizzleAsyncProvider } from "@sparcs-clubs/api/drizzle/drizzle.provider";
import { FundingDeadlineD } from "@sparcs-clubs/api/drizzle/schema/semester.schema";

@Injectable()
export class FundingDeadlineSqlRepository {
  constructor(@Inject(DrizzleAsyncProvider) private db: MySql2Database) {}

  async checkExistingFundingDeadline(
    semesterId: number,
    startTermStr: string,
    endTermStr: string,
  ): Promise<boolean> {
    const existingDeadlines = await this.db
      .select()
      .from(FundingDeadlineD)
      .where(
        and(
          or(
            and(
              gt(sql`DATE(${FundingDeadlineD.endTerm})`, startTermStr),
              lt(sql`DATE(${FundingDeadlineD.endTerm})`, endTermStr),
            ),
            and(
              gt(sql`DATE(${FundingDeadlineD.startTerm})`, startTermStr),
              lt(sql`DATE(${FundingDeadlineD.startTerm})`, endTermStr),
            ),
            eq(sql`DATE(${FundingDeadlineD.startTerm})`, startTermStr),
            eq(sql`DATE(${FundingDeadlineD.endTerm})`, endTermStr),
            and(
              lt(sql`DATE(${FundingDeadlineD.startTerm})`, endTermStr),
              gt(sql`DATE(${FundingDeadlineD.endTerm})`, endTermStr),
            ),
            and(
              gt(sql`DATE(${FundingDeadlineD.startTerm})`, startTermStr),
              lt(sql`DATE(${FundingDeadlineD.endTerm})`, startTermStr),
            ),
          ),
          eq(FundingDeadlineD.semesterId, semesterId),
          isNull(FundingDeadlineD.deletedAt),
        ),
      );

    return existingDeadlines.length > 0;
  }

  async createFundingDeadline(
    startTermStr: string,
    endTermStr: string,
    deadlineEnum: number,
    semesterId: number,
  ): Promise<boolean> {
    try {
      await this.db.transaction(async tx => {
        const [result] = await tx.insert(FundingDeadlineD).values({
          startTerm: sql`DATE(${startTermStr})`,
          endTerm: sql`DATE(${endTermStr})`,
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
      );
    return fundingDeadlines;
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
