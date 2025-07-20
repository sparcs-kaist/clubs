import { Inject, Injectable } from "@nestjs/common";
import {
  and,
  count,
  desc,
  eq,
  gt,
  gte,
  inArray,
  isNotNull,
  isNull,
  lt,
  lte,
  not,
  or,
} from "drizzle-orm";
import { MySql2Database } from "drizzle-orm/mysql2";

import logger from "@sparcs-clubs/api/common/util/logger";
import { takeOne } from "@sparcs-clubs/api/common/util/util";
import { DrizzleAsyncProvider } from "@sparcs-clubs/api/drizzle/drizzle.provider";
import {
  ClubDelegate,
  ClubOld,
  ClubStudentT,
} from "@sparcs-clubs/api/drizzle/schema/club.schema";
import { SemesterD } from "@sparcs-clubs/api/drizzle/schema/semester.schema";
import { Student, User } from "@sparcs-clubs/api/drizzle/schema/user.schema";
import { MOldStudent } from "@sparcs-clubs/api/feature/user/model/old.student.model";

@Injectable()
export default class ClubStudentTRepository {
  constructor(@Inject(DrizzleAsyncProvider) private db: MySql2Database) {}

  async findByClubIdAndSemesterId(clubId: number, semesterId: number) {
    const result = await this.db
      .select()
      .from(ClubStudentT)
      .where(
        and(
          eq(ClubStudentT.clubId, clubId),
          eq(ClubStudentT.semesterId, semesterId),
          isNull(ClubStudentT.deletedAt),
        ),
      );

    return result;
  }

  // 아래는 common 폴더에 있던 club.club-student-t.repository.ts를 그대로 옮겨온 메소드들입니다.
  async findTotalMemberCnt(
    clubId: number,
    semesterId: number,
  ): Promise<number> {
    const today = new Date();

    const totalMemberCnt = await this.db
      .select({ totalMemberCnt: count() })
      .from(ClubStudentT)
      .where(
        and(
          eq(ClubStudentT.clubId, clubId),
          semesterId
            ? eq(ClubStudentT.semesterId, semesterId)
            : and(
                lte(ClubStudentT.startTerm, today),
                or(
                  gte(ClubStudentT.endTerm, today),
                  isNull(ClubStudentT.endTerm),
                ),
                isNull(ClubStudentT.deletedAt),
              ),
        ),
      )
      .then(result => result[0].totalMemberCnt);
    return totalMemberCnt;
  }

  async findStudentSemester(studentId: number) {
    return this.db
      .select({
        id: SemesterD.id,
        name: SemesterD.name,
        year: SemesterD.year,
        startTerm: SemesterD.startTerm,
        endTerm: SemesterD.endTerm,
        clubs: { id: ClubStudentT.clubId },
      })
      .from(ClubStudentT)
      .leftJoin(SemesterD, eq(SemesterD.id, ClubStudentT.semesterId))
      .where(eq(ClubStudentT.studentId, studentId))
      .orderBy(desc(SemesterD.id))
      .then(result =>
        result.map(row => ({
          id: row.id,
          name: `${row.year} ${row.name}`,
          startTerm: row.startTerm,
          endTerm: row.endTerm,
          clubs: [{ id: row.clubs.id }],
        })),
      );
  }

  async findClubStudentByClubIdAndStudentId(
    clubId: number,
    studentId: number,
  ): Promise<{
    club_student_id: number;
    student_id: number;
    club_id: number;
    name: string;
    phoneNumber: string;
    email: string;
  }> {
    const student = await this.db
      .select({
        club_student_id: ClubStudentT.id,
        student_id: Student.id,
        club_id: ClubStudentT.clubId,
        name: Student.name,
        phoneNumber: User.phoneNumber,
        email: Student.email,
      })
      .from(ClubStudentT)
      .leftJoin(Student, eq(Student.id, studentId))
      .leftJoin(User, eq(User.id, Student.userId))
      .where(
        and(
          eq(ClubStudentT.clubId, clubId),
          eq(ClubStudentT.studentId, studentId),
        ),
      )
      .then(takeOne);
    // Todo: 현재 학기에 활동 중인지 필터링 해야함.
    return student;
  }

  async getClubsByStudentId(studentId: number) {
    const today = new Date();
    const clubs = await this.db
      .select({
        id: ClubStudentT.clubId,
        nameKr: ClubOld.nameKr,
        nameEn: ClubOld.nameEn,
      })
      .from(ClubStudentT)
      .leftJoin(ClubOld, eq(ClubOld.id, ClubStudentT.clubId))
      .where(
        and(
          eq(ClubStudentT.studentId, studentId),
          lte(ClubStudentT.startTerm, today),
          or(gte(ClubStudentT.endTerm, today), eq(ClubStudentT.endTerm, null)),
        ),
      );
    return clubs;
  }

  async addStudentToClub(
    studentId: number,
    clubId: number,
    semesterId: number,
    startTerm: Date,
  ): Promise<void> {
    await this.db
      .insert(ClubStudentT)
      .values({
        studentId,
        clubId,
        semesterId,
        startTerm,
      })
      .execute();
  }

  // ** 주의: delegate 또는 일반 부원을 제거합니다.
  // ** 제거 시 hard deletion이 이루어집니다.
  async removeStudentFromClub(
    studentId: number,
    clubId: number,
    semesterId: number,
    isTargetStudentDelegate: boolean,
  ): Promise<void> {
    if (isTargetStudentDelegate)
      await this.db
        .delete(ClubDelegate)
        .where(
          and(
            eq(ClubDelegate.studentId, studentId),
            eq(ClubDelegate.clubId, clubId),
            isNull(ClubDelegate.deletedAt),
          ),
        )
        .execute();
    await this.db
      .delete(ClubStudentT)
      .where(
        and(
          eq(ClubStudentT.studentId, studentId),
          eq(ClubStudentT.clubId, clubId),
          eq(ClubStudentT.semesterId, semesterId),
          isNull(ClubStudentT.deletedAt),
        ),
      )
      .execute();
  }

  /**
   * @param param
   * @returns 어떤 동아리에 해당 기간동안 활동한 학생 목록을 가져옵니다.
   * @description 동아리 회원이 변경되는 기간이 매우 한정적이기에 동시성을 지원하지 않습니다.
   */
  async selectStudentByClubIdAndDuration(param: {
    clubId: number;
    duration: {
      startTerm: Date;
      endTerm: Date;
    };
  }) {
    // startTerm과 endTerm 의 값을 한국시간대에 맞게 변형합니다.
    function toKST(date) {
      const KST_OFFSET = -9 * 60 * 60 * 1000; // UTC+9
      return new Date(date.getTime() + KST_OFFSET);
    }

    const startTermKST = toKST(new Date(param.duration.startTerm));
    const endTermKST = toKST(new Date(param.duration.endTerm));

    const studentIds = await this.db
      .select()
      .from(ClubStudentT)
      .where(
        and(
          eq(ClubStudentT.clubId, param.clubId),
          not(
            or(
              gt(ClubStudentT.startTerm, endTermKST), // 날짜에 대한 컨벤션: 포함관계이므로 not 이니 gt, lt 사용
              and(
                isNotNull(ClubStudentT.endTerm),
                lt(ClubStudentT.endTerm, startTermKST),
              ),
            ),
          ),
          isNull(ClubStudentT.deletedAt),
        ),
      )
      .then(result => result.map(row => row.studentId));
    logger.debug(studentIds);

    if (studentIds.length === 0) return [];
    const result = await this.db
      .select()
      .from(Student)
      .where(and(inArray(Student.id, studentIds), isNull(Student.deletedAt)));

    return result;
  }

  /** NOTE: (@dora)
   * 말 그대로 semesterId 기준, 즉 해당 학기에 활동을 했느냐 기준으로 회원 목록을 반환하는 것이므로
   * 해당 학기의 활동 기간을 다 채우지 못한 회원에 대해서 (예를 들어 중간 탈퇴) 고려하고 있지 않음.
   * 만약 이런 회원들에 대한 처리가 필요해지면 endTerm을 고려하여 로직 수정 필요
   */
  async selectMemberByClubIdAndSemesterId(clubId: number, semesterId: number) {
    return this.db
      .select({
        name: Student.name,
        studentId: Student.id,
        studentNumber: Student.number,
        email: Student.email,
        phoneNumber: User.phoneNumber,
      })
      .from(ClubStudentT)
      .innerJoin(Student, eq(Student.id, ClubStudentT.studentId))
      .leftJoin(User, eq(User.id, Student.userId))
      .where(
        and(
          eq(ClubStudentT.clubId, clubId),
          eq(ClubStudentT.semesterId, semesterId),
          isNull(ClubStudentT.deletedAt),
        ),
      );
  }

  /**
   * Semester랑 ClubIds 로 해당 동아리들을 하는 모든 Member의 IStudentSummary의 Union을 가져옵니다.
   *
   * @param semesterId 학기의 ID
   * @param clubIds 동아리의 ID []
   * @returns MOldStudent[]
   *
   */

  async findUnionByClubIdsAndSemesterId(
    clubIds: number[],
    semesterId: number,
  ): Promise<MOldStudent[]> {
    const result = await this.db
      .select({
        id: ClubStudentT.studentId,
        userId: Student.userId,
        name: Student.name,
        studentNumber: Student.number,
        email: Student.email,
        phoneNumber: User.phoneNumber,
      })
      .from(ClubStudentT)
      .where(
        and(
          eq(ClubStudentT.semesterId, semesterId),
          inArray(ClubStudentT.clubId, clubIds),
          and(isNull(ClubStudentT.deletedAt), isNull(ClubStudentT.deletedAt)),
        ),
      )
      .innerJoin(Student, eq(Student.id, ClubStudentT.studentId))
      .leftJoin(User, eq(User.id, Student.userId));

    return result.map(
      row =>
        new MOldStudent({
          ...row,
          studentNumber: row.studentNumber.toString(),
        }), // TODO: studentNumber가 string으로 바뀌면 변경 필요
    );
  }
}
