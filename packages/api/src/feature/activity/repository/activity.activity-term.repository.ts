import { Inject, Injectable } from "@nestjs/common";
import { and, desc, gte, isNull, lt, lte } from "drizzle-orm";
import { MySql2Database } from "drizzle-orm/mysql2";

// import logger from "@sparcs-clubs/api/common/util/logger";
import { DrizzleAsyncProvider } from "@sparcs-clubs/api/drizzle/drizzle.provider";
import { ActivityD } from "@sparcs-clubs/api/drizzle/schema/semester.schema";

@Injectable()
export default class ActivityActivityTermRepository {
  constructor(@Inject(DrizzleAsyncProvider) private db: MySql2Database) {}

  /**
   * @param date 날짜를 받습니다.
   * @returns 해당 날짜가 포함된 활동기간의 정보를 리턴합니다.
   * 배열 내부 객체로 리턴하며, 배열의 길이는 항상 1 이하여야 합니다.
   * 이 제한조건은 호출자가 직접 검사해야 합니다.
   */
  async selectActivityDByDate(date: Date) {
    const result = await this.db
      .select()
      .from(ActivityD)
      .where(
        and(
          lte(ActivityD.startTerm, date),
          gte(ActivityD.endTerm, date),
          isNull(ActivityD.deletedAt),
        ),
      )
      .orderBy(desc(ActivityD.endTerm));
    return result;
  }

  /**
   * @param date 날짜를 받습니다.
   * @returns 해당 날짜가 포함된 활동기간의 __직전__ 활동기간 정보를 리턴합니다.
   * 배열 내부 객체로 리턴하며, 배열의 길이는 항상 1 이여야 합니다.
   */
  async selectLastActivityDByDate(date: Date) {
    const result = await this.db
      .select()
      .from(ActivityD)
      .where(and(lt(ActivityD.endTerm, date), isNull(ActivityD.deletedAt)))
      .orderBy(desc(ActivityD.endTerm))
      .limit(1);
    return result;
  }
}
