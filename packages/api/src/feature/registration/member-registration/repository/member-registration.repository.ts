import { HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { and, eq, inArray, isNull, SQL } from "drizzle-orm";
import { MySql2Database } from "drizzle-orm/mysql2";

import {
  IMemberRegistrationCreate,
  IMemberRegistrationUpdate,
} from "@sparcs-clubs/interface/api/registration/type/member.registration.type";
import { RegistrationApplicationStudentStatusEnum } from "@sparcs-clubs/interface/common/enum/registration.enum";

import { getKSTDate } from "@sparcs-clubs/api/common/util/util";
import {
  DrizzleAsyncProvider,
  DrizzleTransaction,
} from "@sparcs-clubs/api/drizzle/drizzle.provider";
import { RegistrationApplicationStudent } from "@sparcs-clubs/api/drizzle/schema/registration.schema";
import { MMemberRegistration } from "@sparcs-clubs/api/feature/registration/member-registration/model/member.registration.model";

@Injectable()
export class MemberRegistrationRepository {
  @Inject(DrizzleAsyncProvider) private db: MySql2Database;
  constructor() {}

  async withTransaction<Result>(
    callback: (tx: DrizzleTransaction) => Promise<Result>,
  ): Promise<Result> {
    return this.db.transaction(callback);
  }

  async findTx(
    tx: DrizzleTransaction,
    param: {
      id?: number;
      ids?: number[];
      studentId?: number;
      clubId?: number;
      registrationApplicationStudentEnum?: number;
      registrationApplicationStudentEnums?: number[];
    },
  ): Promise<MMemberRegistration[]> {
    const whereClaues: SQL[] = [];
    if (param.id) {
      whereClaues.push(eq(RegistrationApplicationStudent.id, param.id));
    }
    if (param.ids) {
      whereClaues.push(inArray(RegistrationApplicationStudent.id, param.ids));
    }
    if (param.studentId) {
      whereClaues.push(
        eq(RegistrationApplicationStudent.studentId, param.studentId),
      );
    }
    if (param.clubId) {
      whereClaues.push(eq(RegistrationApplicationStudent.clubId, param.clubId));
    }
    if (param.registrationApplicationStudentEnum) {
      whereClaues.push(
        eq(
          RegistrationApplicationStudent.registrationApplicationStudentEnumId,
          param.registrationApplicationStudentEnum,
        ),
      );
    }
    if (param.registrationApplicationStudentEnums) {
      whereClaues.push(
        inArray(
          RegistrationApplicationStudent.registrationApplicationStudentEnumId,
          param.registrationApplicationStudentEnums,
        ),
      );
    }
    whereClaues.push(isNull(RegistrationApplicationStudent.deletedAt));

    const result = await tx
      .select()
      .from(RegistrationApplicationStudent)
      .where(and(...whereClaues));

    return result.map(row => MMemberRegistration.from(row));
  }

  async find(param: {
    id?: number;
    ids?: number[];
    studentId?: number;
    clubId?: number;
    registrationApplicationStudentEnum?: number;
    registrationApplicationStudentEnums?: number[];
  }): Promise<MMemberRegistration[]> {
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
      .set(param)
      .where(eq(RegistrationApplicationStudent.id, param.id));
    if (result.affectedRows === 0) {
      throw new HttpException("Failed to update", HttpStatus.BAD_REQUEST);
    }
  }
  async update(param: IMemberRegistrationUpdate): Promise<void> {
    await this.withTransaction(async tx => this.updateTx(tx, param));
  }

  async deleteTx(tx: DrizzleTransaction, id: number): Promise<void> {
    const cur = getKSTDate();
    const [result] = await tx
      .update(RegistrationApplicationStudent)
      .set({ deletedAt: cur })
      .where(eq(RegistrationApplicationStudent.id, id));
    if (result.affectedRows === 0) {
      throw new HttpException("Failed to delete", HttpStatus.BAD_REQUEST);
    }
  }
  async delete(id: number): Promise<void> {
    await this.withTransaction(async tx => this.deleteTx(tx, id));
  }
}
