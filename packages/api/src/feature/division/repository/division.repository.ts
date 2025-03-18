import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { and, eq, gte, inArray, isNull, lte, or } from "drizzle-orm";
import { MySql2Database } from "drizzle-orm/mysql2";

import { IDivisionSummary } from "@sparcs-clubs/interface/api/club/type/club.type";
import { IDivision } from "@sparcs-clubs/interface/api/division/type/division.type";

import { getKSTDate, takeOne } from "@sparcs-clubs/api/common/util/util";
import {
  DrizzleAsyncProvider,
  DrizzleTransaction,
} from "@sparcs-clubs/api/drizzle/drizzle.provider";
import {
  Division,
  DivisionPresidentD,
} from "@sparcs-clubs/api/drizzle/schema/division.schema";

import { MDivision } from "../model/division.model";

@Injectable()
export default class DivisionRepository {
  constructor(@Inject(DrizzleAsyncProvider) private db: MySql2Database) {}

  async withTransaction<Result>(
    callback: (tx: DrizzleTransaction) => Promise<Result>,
  ): Promise<Result> {
    return this.db.transaction(callback);
  }
  async selectDivisionsAndDivisionPresidents() {
    const today = getKSTDate();

    const result = await this.db
      .select()
      .from(Division)
      .innerJoin(
        DivisionPresidentD,
        and(
          isNull(Division.deletedAt),
          isNull(DivisionPresidentD.deletedAt),
          eq(Division.id, DivisionPresidentD.divisionId),
          lte(DivisionPresidentD.startTerm, today),
          gte(DivisionPresidentD.endTerm, today),
        ),
      );
    return result;
  }

  async findDivisionById(divisionId: number): Promise<number | undefined> {
    const result = await this.db
      .select({ id: Division.id })
      .from(Division)
      .where(and(eq(Division.id, divisionId), isNull(Division.deletedAt)))
      .then(takeOne);
    return result ? result.id : undefined;
  }

  async selectDivisionById(param: { id: number }) {
    const result = await this.db
      .select()
      .from(Division)
      .where(and(eq(Division.id, param.id), isNull(Division.deletedAt)));
    return result;
  }

  async fetchSummaries(ids: number[]): Promise<IDivisionSummary[]> {
    if (ids.length === 0) {
      return [];
    }

    const result = await this.db
      .select({
        id: Division.id,
        name: Division.name,
      })
      .from(Division)
      .where(inArray(Division.id, ids));
    return result;
  }

  async fetchSummary(id: number): Promise<IDivisionSummary> {
    const result = await this.db
      .select({
        id: Division.id,
        name: Division.name,
      })
      .from(Division)
      .where(and(eq(Division.id, id), isNull(Division.deletedAt)));

    if (result.length !== 1) {
      throw new NotFoundException("Division not found");
    }

    return result[0];
  }

  async fetchAllTx(
    tx: DrizzleTransaction,
    arg1: Date | number[],
  ): Promise<IDivision[]> {
    // find part
    const whereCondition = [];

    if (arg1 instanceof Date) {
      whereCondition.push(lte(Division.startTerm, arg1));
      whereCondition.push(
        or(gte(Division.endTerm, arg1), isNull(Division.endTerm)),
      );
    }

    if (arg1 instanceof Array) {
      whereCondition.push(inArray(Division.id, arg1));
    }
    whereCondition.push(isNull(Division.deletedAt));

    const result = await tx
      .select()
      .from(Division)
      .where(and(...whereCondition));

    // fetch validation part
    if (arg1 instanceof Date) {
      // Date인 경우 결과가 없으면 예외 발생
      if (result.length === 0) {
        throw new NotFoundException("Division not found");
      }
    }

    if (arg1 instanceof Array) {
      // ID Array의 경우 주어진 값이 모두 나오지 않으면 예외 발생
      if (result.length !== Array.from(new Set(arg1)).length) {
        throw new NotFoundException("Division not found");
      }
    }
    return result.map(e => MDivision.fromDB(e));
  }

  async fetchAll(date: Date): Promise<IDivision[]>;
  async fetchAll(ids: IDivision["id"][]): Promise<IDivision[]>;
  async fetchAll(arg1: Date | number[]): Promise<IDivision[]> {
    return this.withTransaction(tx => this.fetchAllTx(tx, arg1));
  }
}
