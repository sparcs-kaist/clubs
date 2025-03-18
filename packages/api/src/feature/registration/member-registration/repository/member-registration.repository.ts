import { HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { and, count, eq, inArray, isNull, SQL } from "drizzle-orm";
import { MySql2Database } from "drizzle-orm/mysql2";

import {
  IMemberRegistrationCreate,
  IMemberRegistrationUpdate,
} from "@sparcs-clubs/interface/api/registration/type/member.registration.type";
import {
  RegistrationApplicationStudentStatusEnum,
  RegistrationDeadlineEnum,
} from "@sparcs-clubs/interface/common/enum/registration.enum";

import { getKSTDate } from "@sparcs-clubs/api/common/util/util";
import {
  DrizzleAsyncProvider,
  DrizzleTransaction,
} from "@sparcs-clubs/api/drizzle/drizzle.provider";
import {
  RegistrationApplicationStudent,
  RegistrationDeadlineD,
} from "@sparcs-clubs/api/drizzle/schema/registration.schema";
import {
  IMemberRegistrationOrderBy,
  MMemberRegistration,
} from "@sparcs-clubs/api/feature/registration/member-registration/model/member.registration.model";

type IMemberRegistrationQuery = {
  id?: number;
  ids?: number[];
  studentId?: number;
  clubId?: number;
  semesterId?: number;
  pagination?: {
    offset: number;
    itemCount: number;
  };
  orderBy?: IMemberRegistrationOrderBy;
  registrationApplicationStudentEnum?: number;
  registrationApplicationStudentEnums?: number[];
};

@Injectable()
export class MemberRegistrationRepository {
  @Inject(DrizzleAsyncProvider) private db: MySql2Database;
  constructor() {}

  async withTransaction<Result>(
    callback: (tx: DrizzleTransaction) => Promise<Result>,
  ): Promise<Result> {
    return this.db.transaction(callback);
  }

  private makeWhereClause(param: IMemberRegistrationQuery): SQL[] {
    const whereClause: SQL[] = [];
    if (param.id) {
      whereClause.push(eq(RegistrationApplicationStudent.id, param.id));
    }
    if (param.ids) {
      whereClause.push(inArray(RegistrationApplicationStudent.id, param.ids));
    }
    if (param.studentId) {
      whereClause.push(
        eq(RegistrationApplicationStudent.studentId, param.studentId),
      );
    }
    if (param.clubId) {
      whereClause.push(eq(RegistrationApplicationStudent.clubId, param.clubId));
    }
    if (param.semesterId) {
      whereClause.push(
        eq(RegistrationApplicationStudent.semesterId, param.semesterId),
      );
    }
    if (param.registrationApplicationStudentEnum) {
      whereClause.push(
        eq(
          RegistrationApplicationStudent.registrationApplicationStudentEnumId,
          param.registrationApplicationStudentEnum,
        ),
      );
    }
    if (param.registrationApplicationStudentEnums) {
      whereClause.push(
        inArray(
          RegistrationApplicationStudent.registrationApplicationStudentEnumId,
          param.registrationApplicationStudentEnums,
        ),
      );
    }
    whereClause.push(isNull(RegistrationApplicationStudent.deletedAt));

    return whereClause;
  }

  async countTx(
    tx: DrizzleTransaction,
    param: IMemberRegistrationQuery,
  ): Promise<number> {
    const [result] = await tx
      .select({ count: count() })
      .from(RegistrationApplicationStudent)
      .where(and(...this.makeWhereClause(param)));

    return result.count;
  }

  async count(param: IMemberRegistrationQuery): Promise<number> {
    return this.withTransaction(async tx => this.countTx(tx, param));
  }

  async findTx(
    tx: DrizzleTransaction,
    param: IMemberRegistrationQuery,
  ): Promise<MMemberRegistration[]> {
    let query = tx
      .select()
      .from(RegistrationApplicationStudent)
      .where(and(...this.makeWhereClause(param)))
      .$dynamic();

    if (param.pagination) {
      query = query.limit(param.pagination.itemCount);
      query = query.offset(
        (param.pagination.offset - 1) * param.pagination.itemCount,
      );
    }
    if (param.orderBy) {
      query = query.orderBy(...MMemberRegistration.makeOrderBy(param.orderBy));
    }

    const result = await query.execute();

    return result.map(row => MMemberRegistration.from(row));
  }

  async find(param: IMemberRegistrationQuery): Promise<MMemberRegistration[]> {
    return this.withTransaction(async tx => this.findTx(tx, param));
  }

  async insertTx(
    tx: DrizzleTransaction,
    param: IMemberRegistrationCreate,
  ): Promise<void> {
    const [result] = await tx.insert(RegistrationApplicationStudent).values({
      ...param,
      registrationApplicationStudentEnumId:
        RegistrationApplicationStudentStatusEnum.Pending,
    });
    if (result.insertId === undefined) {
      throw new HttpException("Failed to insert", HttpStatus.BAD_REQUEST);
    }
  }

  async insert(param: IMemberRegistrationCreate): Promise<void> {
    await this.withTransaction(async tx => this.insertTx(tx, param));
  }

  async updateTx(
    tx: DrizzleTransaction,
    param: IMemberRegistrationUpdate,
  ): Promise<void> {
    const [result] = await tx
      .update(RegistrationApplicationStudent)
      .set({
        registrationApplicationStudentEnumId:
          param.registrationApplicationStudentEnum,
      })
      .where(
        and(
          eq(RegistrationApplicationStudent.id, param.id),
          isNull(RegistrationApplicationStudent.deletedAt),
        ),
      );
    if (result.affectedRows === 0) {
      throw new HttpException("Failed to update", HttpStatus.BAD_REQUEST);
    }
  }
  async update(param: IMemberRegistrationUpdate): Promise<void> {
    await this.withTransaction(async tx => this.updateTx(tx, param));
  }

  async deleteTx(
    tx: DrizzleTransaction,
    studentId: number,
    id: number,
  ): Promise<void> {
    const cur = getKSTDate();
    const [result] = await tx
      .update(RegistrationApplicationStudent)
      .set({ deletedAt: cur })
      .where(
        and(
          eq(RegistrationApplicationStudent.id, id),
          eq(RegistrationApplicationStudent.studentId, studentId),
          isNull(RegistrationApplicationStudent.deletedAt),
        ),
      );
    if (result.affectedRows === 0) {
      throw new HttpException("Failed to delete", HttpStatus.BAD_REQUEST);
    }
  }

  async delete(studentId: number, id: number): Promise<void> {
    await this.withTransaction(async tx => this.deleteTx(tx, studentId, id));
  }

  async selectMemberRegistrationDeadline(param: { semesterId: number }) {
    const result = await this.db
      .select()
      .from(RegistrationDeadlineD)
      .where(
        and(
          eq(RegistrationDeadlineD.semesterId, param.semesterId),
          eq(
            RegistrationDeadlineD.registrationDeadlineEnumId,
            RegistrationDeadlineEnum.StudentRegistrationApplication,
          ),
          isNull(RegistrationDeadlineD.deletedAt),
        ),
      );
    return result;
  }
}
