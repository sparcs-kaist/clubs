import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { and, eq, gte, inArray, isNull, lte, or } from "drizzle-orm";
import { MySql2Database } from "drizzle-orm/mysql2";

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
    const crt = getKSTDate();
    const result = await this.db
      .select()
      .from(ExecutiveT)
      .where(
        and(
          eq(ExecutiveT.executiveId, id),
          or(gte(ExecutiveT.endTerm, crt), isNull(ExecutiveT.endTerm)),
          lte(ExecutiveT.startTerm, crt),
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
}
