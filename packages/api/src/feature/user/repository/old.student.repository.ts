import { Inject, Injectable } from "@nestjs/common";
import { and, count, eq, gte, inArray, isNull, lte, or } from "drizzle-orm";
import { MySql2Database } from "drizzle-orm/mysql2";

import { IStudentSummary } from "@clubs/interface/api/user/type/user.type";
import { StudentStatusEnum } from "@clubs/interface/common/enum/user.enum";

import logger from "@sparcs-clubs/api/common/util/logger";
import { getKSTDate, takeOne } from "@sparcs-clubs/api/common/util/util";
import { DrizzleAsyncProvider } from "@sparcs-clubs/api/drizzle/drizzle.provider";
import {
  Student,
  StudentT,
  User,
} from "@sparcs-clubs/api/drizzle/schema/user.schema";

@Injectable()
export default class OldStudentRepository {
  constructor(@Inject(DrizzleAsyncProvider) private db: MySql2Database) {}

  async selectStudentById(id: number) {
    const result = await this.db
      .select({
        id: Student.id,
        userId: Student.userId,
        number: Student.number,
        name: Student.name,
        email: Student.email,
        createdAt: Student.createdAt,
        deletedAt: Student.deletedAt,
        phoneNumber: User.phoneNumber,
      })
      .from(Student)
      .leftJoin(User, eq(User.id, Student.userId))
      .where(and(eq(Student.id, id), isNull(Student.deletedAt)));

    return result;
  }

  async isNotgraduateStudent(
    studentId: number,
    semesterId: number,
  ): Promise<boolean> {
    const leaveOfAbsence = StudentStatusEnum.LeaveOfAbsence;
    const attending = StudentStatusEnum.Attending;
    const { isAvailable } = await this.db
      .select({ isAvailable: count(StudentT.id) })
      .from(StudentT)
      .where(
        and(
          eq(StudentT.semesterId, semesterId),
          eq(StudentT.studentId, studentId),
          or(
            eq(StudentT.studentStatusEnum, attending),
            eq(StudentT.studentStatusEnum, leaveOfAbsence),
          ),
        ),
      )
      .then(takeOne);
    if (isAvailable !== 0) {
      return true;
    }
    return false;
  }

  async selectStudentIdByStudentTId(studentTId: number) {
    const result = await this.db
      .select({ studentId: StudentT.studentId })
      .from(StudentT)
      .where(and(eq(StudentT.id, studentTId), isNull(StudentT.deletedAt)));

    return result;
  }

  async selectStudentStatusEnumIdByStudentIdSemesterId(
    studentId: number,
    semesterId: number,
  ) {
    const result = await this.db
      .select({ studentEnumId: StudentT.studentEnum })
      .from(StudentT)
      .where(
        and(
          eq(StudentT.studentId, studentId),
          eq(StudentT.semesterId, semesterId),
          isNull(StudentT.deletedAt),
        ),
      )
      .then(takeOne);
    return result;
  }

  async getStudentEnumsByIdsAndSemesterId(
    studentIds: number[],
    semesterId: number,
  ) {
    const result = await this.db
      .select({ id: StudentT.studentId, studentEnumId: StudentT.studentEnum })
      .from(StudentT)
      .where(
        and(
          inArray(StudentT.studentId, studentIds),
          eq(StudentT.semesterId, semesterId),
          isNull(StudentT.deletedAt),
        ),
      );
    return result;
  }

  async getStudentPhoneNumber(id: number) {
    const crt = getKSTDate();
    const result = await this.db
      .select({ phoneNumber: User.phoneNumber })
      .from(Student)
      .leftJoin(User, eq(User.id, Student.userId))
      .where(eq(Student.userId, id))
      .leftJoin(
        StudentT,
        and(
          eq(StudentT.studentId, Student.id),
          or(gte(StudentT.endTerm, crt), isNull(StudentT.endTerm)),
          lte(StudentT.startTerm, crt),
          isNull(StudentT.deletedAt),
        ),
      )
      .then(takeOne);
    return result;
  }

  async updateStudentPhoneNumber(userId: number, phoneNumber: string) {
    const isUpdateSucceed = await this.db.transaction(async tx => {
      const [result] = await tx
        .update(User)
        .set({ phoneNumber })
        .where(and(eq(User.id, userId), isNull(User.deletedAt)));

      if (result.affectedRows === 0) {
        logger.debug("[OldStudentRepository] Failed to update phone number");
        tx.rollback();
        return false;
      }
      return true;
    });
    return isUpdateSucceed;
  }

  async fetchStudentSummaries(
    studentIds: number[],
  ): Promise<IStudentSummary[]> {
    if (studentIds.length === 0) {
      return [];
    }
    const students = await this.db
      .select()
      .from(Student)
      .where(and(inArray(Student.id, studentIds), isNull(Student.deletedAt)));

    return students.map(student => ({
      id: student.id,
      name: student.name,
      studentNumber: student.number.toString(),
    }));
  }
}
