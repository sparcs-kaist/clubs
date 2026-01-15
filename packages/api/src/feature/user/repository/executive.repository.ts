import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { formatInTimeZone } from "date-fns-tz";
import {
  and,
  eq,
  gte,
  inArray,
  isNotNull,
  isNull,
  lte,
  or,
  sql,
} from "drizzle-orm";
import { MySql2Database } from "drizzle-orm/mysql2";

import { IntentionalRollback } from "@sparcs-clubs/api/common/util/exception.filter";
import { getKSTDate, takeOne } from "@sparcs-clubs/api/common/util/util";
import { DrizzleAsyncProvider } from "@sparcs-clubs/api/drizzle/drizzle.provider";
import {
  Executive,
  ExecutiveT,
  Student,
  User,
} from "@sparcs-clubs/api/drizzle/schema/user.schema";

import { VExecutiveSummary } from "../model/executive.summary.model";

@Injectable()
export default class ExecutiveRepository {
  constructor(@Inject(DrizzleAsyncProvider) private db: MySql2Database) {}

  async findExecutiveById(id: number): Promise<boolean> {
    const date = formatInTimeZone(new Date(), "Asia/Seoul", "yyyy-MM-dd");
    const result = await this.db
      .select()
      .from(ExecutiveT)
      .where(
        and(
          eq(ExecutiveT.executiveId, id),
          or(
            gte(sql`DATE(${ExecutiveT.endTerm})`, date),
            isNull(ExecutiveT.endTerm),
          ),
          lte(sql`DATE(${ExecutiveT.startTerm})`, date),
        ),
      );
    return result.length > 0;
  }

  async findExecutiveByUserId(id: number): Promise<boolean> {
    const date = formatInTimeZone(new Date(), "Asia/Seoul", "yyyy-MM-dd");
    const result = await this.db
      .select()
      .from(Executive)
      .where(and(eq(Executive.userId, id), isNull(Executive.deletedAt)))
      .innerJoin(
        ExecutiveT,
        and(
          eq(ExecutiveT.executiveId, Executive.id),
          or(
            gte(sql`DATE(${ExecutiveT.endTerm})`, date),
            isNull(ExecutiveT.endTerm),
          ),
          lte(sql`DATE(${ExecutiveT.startTerm})`, date),
        ),
      );
    return result.length > 0;
  }

  // 주의: Executive를 조회하는 것이 아닌 ExecutiveT를 조회합니다.
  async getExecutiveById(id: number) {
    const crt = getKSTDate();
    const result = await this.db
      .select()
      .from(ExecutiveT)
      .where(
        and(
          eq(ExecutiveT.executiveId, id),
          or(gte(ExecutiveT.endTerm, crt), isNull(ExecutiveT.endTerm)),
          lte(ExecutiveT.startTerm, crt),
          isNull(ExecutiveT.deletedAt),
        ),
      );
    return result;
  }

  async getExecutivePhoneNumber(id: number) {
    const crt = getKSTDate();
    const result = await this.db
      .select({ phoneNumber: User.phoneNumber })
      .from(Executive)
      .leftJoin(User, eq(User.id, Executive.userId))
      .where(eq(Executive.userId, id))
      .leftJoin(
        ExecutiveT,
        and(
          eq(ExecutiveT.executiveId, Executive.id),
          or(gte(ExecutiveT.endTerm, crt), isNull(ExecutiveT.endTerm)),
          lte(ExecutiveT.startTerm, crt),
          isNull(ExecutiveT.deletedAt),
        ),
      )
      .then(takeOne);
    return result;
  }

  async updateExecutivePhoneNumber(id: number, phoneNumber: string) {
    const isUpdateSucceed = await this.db.transaction(async tx => {
      const [result] = await tx
        .update(User)
        .set({ phoneNumber })
        .where(and(eq(User.id, id), isNull(User.deletedAt)));
      if (result.affectedRows === 0) {
        tx.rollback();
        return false;
      }
      return true;
    });
    return isUpdateSucceed;
  }

  async selectExecutiveById(param: { id: number }) {
    const result = await this.db
      .select()
      .from(Executive)
      .where(and(eq(Executive.id, param.id), isNull(Executive.deletedAt)));

    return result;
  }

  async selectExecutiveByDate(param: { date: Date }) {
    const result = await this.db
      .select()
      .from(ExecutiveT)
      .where(
        and(
          lte(ExecutiveT.startTerm, param.date),
          or(gte(ExecutiveT.endTerm, param.date), isNull(ExecutiveT.endTerm)),
          isNull(ExecutiveT.deletedAt),
        ),
      )
      .innerJoin(
        Executive,
        and(
          eq(Executive.id, ExecutiveT.executiveId),
          isNull(Executive.deletedAt),
        ),
      );

    return result;
  }

  async fetchExecutiveSummaries(date: Date): Promise<VExecutiveSummary[]> {
    const result = await this.db
      .select()
      .from(ExecutiveT)
      .where(
        and(
          lte(ExecutiveT.startTerm, date),
          or(gte(ExecutiveT.endTerm, date), isNull(ExecutiveT.endTerm)),
          isNull(ExecutiveT.deletedAt),
        ),
      )
      .innerJoin(
        Executive,
        and(
          eq(Executive.id, ExecutiveT.executiveId),
          isNull(Executive.deletedAt),
        ),
      )
      .innerJoin(
        Student,
        and(eq(Student.userId, Executive.userId), isNull(Student.deletedAt)),
      );
    return result.map(VExecutiveSummary.fromDBResult);
  }

  async fetchSummaries(executiveIds: number[]): Promise<VExecutiveSummary[]> {
    if (executiveIds.length === 0) {
      return [];
    }

    const result = await this.db
      .select()
      .from(Executive)
      .where(
        and(inArray(Executive.id, executiveIds), isNull(Executive.deletedAt)),
      )
      .innerJoin(
        Student,
        and(eq(Student.userId, Executive.userId), isNull(Student.deletedAt)),
      );

    return result.map(VExecutiveSummary.fromDBResult);
  }

  async fetchSummary(id: number): Promise<VExecutiveSummary> {
    const result = await this.findSummary(id);
    if (!result) {
      throw new NotFoundException("Executive not found");
    }
    return result;
  }

  async findSummary(id: number): Promise<VExecutiveSummary | null> {
    const result = await this.db
      .select()
      .from(Executive)
      .where(and(eq(Executive.id, id), isNull(Executive.deletedAt)))
      .innerJoin(
        Student,
        and(eq(Student.userId, Executive.userId), isNull(Student.deletedAt)),
      )
      .then(takeOne);

    return result ? VExecutiveSummary.fromDBResult(result) : null;
  }

  async checkExistExecutiveByIdDate(
    studentId: number,
    startTerm: string,
    endTerm: string,
  ) {
    const result = await this.db
      .select()
      .from(Executive)
      .where(
        and(eq(Executive.studentId, studentId), isNull(Executive.deletedAt)),
      )
      .innerJoin(
        ExecutiveT,
        and(
          eq(ExecutiveT.executiveId, Executive.id),
          isNull(ExecutiveT.deletedAt),
          or(
            // 경우 1: ExecutiveT.endTerm이 null이 아닐 때
            and(
              // ExecutiveT.endTerm이 null이 아님
              isNotNull(ExecutiveT.endTerm),
              or(
                // ExecutiveT.startTerm이 param의 startTerm~endTerm 사이
                and(
                  gte(sql`DATE(${ExecutiveT.startTerm})`, startTerm),
                  lte(sql`DATE(${ExecutiveT.startTerm})`, endTerm),
                ),
                // ExecutiveT.endTerm이 param의 startTerm~endTerm 사이
                and(
                  gte(sql`DATE(${ExecutiveT.endTerm})`, startTerm),
                  lte(sql`DATE(${ExecutiveT.endTerm})`, endTerm),
                ),
                // param의 startTerm~endTerm이 ExecutiveT의 startTerm~endTerm 사이
                and(
                  lte(sql`DATE(${ExecutiveT.startTerm})`, startTerm),
                  gte(sql`DATE(${ExecutiveT.endTerm})`, endTerm),
                ),
              ),
            ),
            // 경우 2: ExecutiveT.endTerm이 null일 때
            and(
              isNull(ExecutiveT.endTerm),
              or(
                // ExecutiveT.startTerm이 param의 startTerm~endTerm 사이
                and(
                  gte(sql`DATE(${ExecutiveT.startTerm})`, startTerm),
                  lte(sql`DATE(${ExecutiveT.startTerm})`, endTerm),
                ),
                // ExecutiveT.startTerm이 param의 startTerm보다 이른 것
                lte(sql`DATE(${ExecutiveT.startTerm})`, startTerm),
              ),
            ),
          ),
        ),
      );
    return result.length > 0;
  }

  async createExecutive(
    studentId: number,
    userId: number,
    email: string,
    name: string,
    startTerm: string,
    endTerm: string,
  ) {
    try {
      await this.db.transaction(async tx => {
        let executiveId: number;
        const existingExecutives = await tx
          .select({ id: Executive.id, deletedAt: Executive.deletedAt })
          .from(Executive)
          .where(eq(Executive.studentId, studentId));
        if (existingExecutives.length > 0) {
          if (existingExecutives[0].deletedAt) {
            // If the existing executive is soft-deleted, restore it
            await tx
              .update(Executive)
              .set({ deletedAt: null })
              .where(eq(Executive.id, existingExecutives[0].id));
          }
          executiveId = existingExecutives[0].id;
        } else {
          const [newExecutive] = await tx
            .insert(Executive)
            .values({ userId, studentId, email, name });
          executiveId = newExecutive.insertId;
        }
        const executiveT = await tx.insert(ExecutiveT).values({
          executiveId,
          executiveStatusEnum: 1,
          executiveBureauEnum: 1,
          startTerm: sql`DATE(${startTerm})`,
          endTerm: sql`DATE(${endTerm})`,
        });
        if (executiveT[0].affectedRows === 0) {
          throw new IntentionalRollback();
        }
        return true;
      });
      // isolation level과 accessmode를 지정하고 싶었지만 에러가 발생하여 일단 지워둠.

      return true;
    } catch (error) {
      if (error instanceof IntentionalRollback) {
        return false;
      }
      throw error;
    }
  }

  async getExecutives() {
    const date = formatInTimeZone(new Date(), "Asia/Seoul", "yyyy-MM-dd");
    const result = await this.db
      .select({
        id: Executive.id,
        userId: Executive.userId,
        studentNumber: Student.number,
        name: User.name,
        email: User.email,
        phoneNumber: User.phoneNumber,
        startTerm: ExecutiveT.startTerm,
        endTerm: ExecutiveT.endTerm,
      })
      .from(Executive)
      .where(isNull(Executive.deletedAt))
      .innerJoin(
        ExecutiveT,
        and(
          eq(ExecutiveT.executiveId, Executive.id),
          or(
            gte(sql`DATE(${ExecutiveT.endTerm})`, date),
            isNull(ExecutiveT.endTerm),
          ),
          lte(sql`DATE(${ExecutiveT.startTerm})`, date),
          isNull(ExecutiveT.deletedAt),
        ),
      )
      .innerJoin(
        User,
        and(eq(User.id, Executive.userId), isNull(User.deletedAt)),
      )
      .innerJoin(
        Student,
        and(eq(Student.id, Executive.studentId), isNull(Student.deletedAt)),
      );
    return result;
  }

  async deleteExecutiveById(executiveId: number) {
    const cur = getKSTDate();
    // const date = formatInTimeZone(new Date(), "Asia/Seoul", "yyyy-MM-dd");
    try {
      await this.db.transaction(async tx => {
        const executiveUpdate = await tx
          .update(Executive)
          .set({ deletedAt: cur })
          .where(
            and(eq(Executive.id, executiveId), isNull(Executive.deletedAt)),
          );
        const executiveTUpdate = await tx
          .update(ExecutiveT)
          .set({ deletedAt: cur })
          .where(
            and(
              eq(ExecutiveT.executiveId, executiveId),
              // 모든 이력 삭제되도록 변경하면서 주석처리함.
              // or(
              //   gte(sql`DATE(${ExecutiveT.endTerm})`, date),
              //   isNull(ExecutiveT.endTerm),
              // ),
              isNull(ExecutiveT.deletedAt),
            ),
          );
        if (
          executiveUpdate[0].affectedRows === 0 ||
          executiveTUpdate[0].affectedRows === 0
        ) {
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
