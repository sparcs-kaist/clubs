import { Inject, Injectable } from "@nestjs/common";
import { and, eq, gte, isNull, lte, or } from "drizzle-orm";
import { MySql2Database } from "drizzle-orm/mysql2";

import logger from "@sparcs-clubs/api/common/util/logger";
import { takeOne } from "@sparcs-clubs/api/common/util/util";
import { DrizzleAsyncProvider } from "@sparcs-clubs/api/drizzle/drizzle.provider";
import {
  Department,
  Student,
  StudentT,
  User,
} from "@sparcs-clubs/api/drizzle/schema/user.schema";

@Injectable()
export default class UserRepository {
  constructor(@Inject(DrizzleAsyncProvider) private db: MySql2Database) {}

  async findStudentById(studentId: number) {
    const crt = new Date();
    const user = await this.db
      .select({
        id: Student.id,
        name: Student.name,
        email: Student.email,
        department: Department.name,
        studentNumber: Student.number,
        phoneNumber: User.phoneNumber,
      })
      .from(Student)
      .where(eq(Student.id, studentId))
      .leftJoin(User, eq(User.id, Student.userId))
      .leftJoin(
        StudentT,
        and(
          eq(StudentT.studentId, Student.id),
          lte(StudentT.startTerm, crt),
          or(gte(StudentT.endTerm, crt), isNull(StudentT.endTerm)),
        ),
      )
      .leftJoin(Department, eq(Department.id, StudentT.department));
    return user;
  }

  async findStudentByStudentNumberNameDate(
    studentNumber: string,
    name: string,
    startTerm: Date,
    endTerm: Date,
  ) {
    const studentnumber = parseInt(studentNumber);
    const user = await this.db
      .select()
      .from(Student)
      .where(
        and(
          eq(Student.number, studentnumber),
          eq(Student.name, name),
          isNull(Student.deletedAt),
        ),
      )
      .innerJoin(
        StudentT,
        and(
          eq(StudentT.studentId, Student.id),
          lte(StudentT.startTerm, startTerm),
          or(gte(StudentT.endTerm, endTerm), isNull(StudentT.endTerm)),
        ),
      );
    return user;
  }

  async create(studentId: number) {
    const user = await this.db
      .select()
      .from(Student)
      .where(eq(Student.id, studentId))
      .leftJoin(User, eq(User.id, Student.userId));
    return user;
  }

  async findUserNameById(userId: number) {
    const userName = await this.db
      .select({ name: User.name })
      .from(User)
      .where(eq(User.id, userId));
    return userName;
  }

  async getPhoneNumber(userId: number) {
    const phoneNumber = await this.db
      .select({ phoneNumber: User.phoneNumber })
      .from(User)
      .where(and(eq(User.id, userId), isNull(User.deletedAt)))
      .then(takeOne);
    return phoneNumber;
  }

  async updatePhoneNumber(userId: number, phoneNumber: string) {
    const isUpdateSucceed = await this.db.transaction(async tx => {
      const [result] = await tx
        .update(User)
        .set({ phoneNumber })
        .where(and(eq(User.id, userId), isNull(User.deletedAt)));
      if (result.affectedRows !== 1) {
        logger.debug("[updatePhoneNumber] rollback occurs");
        tx.rollback();
        return false;
      }
      return true;
    });
    return isUpdateSucceed;
  }
}
