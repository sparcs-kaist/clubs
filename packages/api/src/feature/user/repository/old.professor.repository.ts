import { Inject, Injectable } from "@nestjs/common";
import { and, eq, gte, inArray, isNull, lte, or } from "drizzle-orm";
import { MySql2Database } from "drizzle-orm/mysql2";

import { IProfessor } from "@clubs/interface/api/user/type/user.type";

import logger from "@sparcs-clubs/api/common/util/logger";
import { getKSTDate, takeOne } from "@sparcs-clubs/api/common/util/util";
import { DrizzleAsyncProvider } from "@sparcs-clubs/api/drizzle/drizzle.provider";
import {
  Professor,
  ProfessorT,
  User,
} from "@sparcs-clubs/api/drizzle/schema/user.schema";

@Injectable()
export default class OldProfessorRepository {
  constructor(@Inject(DrizzleAsyncProvider) private db: MySql2Database) {}

  async getProfessorPhoneNumber(id: number) {
    const crt = getKSTDate();
    const result = await this.db
      .select({ phoneNumber: User.phoneNumber })
      .from(Professor)
      .leftJoin(User, eq(User.id, Professor.userId))
      .where(and(eq(Professor.userId, id), isNull(Professor.deletedAt)))
      .leftJoin(
        ProfessorT,
        and(
          eq(ProfessorT.professorId, Professor.id),
          or(gte(ProfessorT.endTerm, crt), isNull(ProfessorT.endTerm)),
          lte(ProfessorT.startTerm, crt),
          isNull(ProfessorT.deletedAt),
        ),
      )
      .then(takeOne);
    return result;
  }

  async selectProfessorById(id: number) {
    return this.db
      .select()
      .from(Professor)
      .where(and(eq(Professor.userId, id), isNull(Professor.deletedAt)));
  }

  async updateProfessorPhoneNumber(id: number, phoneNumber: string) {
    const isUpdateSucceed = await this.db.transaction(async tx => {
      const [result] = await tx
        .update(User)
        .set({ phoneNumber })
        .where(and(eq(User.id, id), isNull(User.deletedAt)));
      if (result.affectedRows === 0) {
        logger.debug("[updatePhoneNumber] rollback occurs");
        tx.rollback();
        return false;
      }
      return true;
    });
    return isUpdateSucceed;
  }

  async findAll(ids: number[]): Promise<IProfessor[]> {
    if (ids.length === 0) {
      return [];
    }

    const professors = await this.db
      .select({
        id: Professor.id,
        name: Professor.name,
        userId: Professor.userId,
        email: Professor.email,
        professorEnum: ProfessorT.professorEnum,
        department: ProfessorT.department,
        phoneNumber: User.phoneNumber,
      })
      .from(Professor)
      .leftJoin(User, eq(User.id, Professor.userId))
      .leftJoin(ProfessorT, eq(ProfessorT.professorId, Professor.id))
      .where(inArray(Professor.id, ids));
    return professors;
  }

  async find(id: number): Promise<IProfessor> {
    const result = await this.db
      .select({
        id: Professor.id,
        name: Professor.name,
        userId: Professor.userId,
        email: Professor.email,
        professorEnum: ProfessorT.professorEnum,
        department: ProfessorT.department,
        phoneNumber: User.phoneNumber,
      })
      .from(Professor)
      .leftJoin(User, eq(User.id, Professor.userId))
      .leftJoin(ProfessorT, eq(ProfessorT.professorId, Professor.id))
      .where(and(eq(Professor.id, id), isNull(Professor.deletedAt)));

    if (result.length !== 1) {
      return null;
    }

    return result[0];
  }
}
