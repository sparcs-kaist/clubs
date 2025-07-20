import { Inject, Injectable } from "@nestjs/common";
import {
  and,
  count,
  desc,
  eq,
  gte,
  isNotNull,
  isNull,
  lte,
  not,
  notInArray,
  or,
} from "drizzle-orm";
import { MySql2Database } from "drizzle-orm/mysql2";

import {
  ClubDelegateChangeRequestStatusEnum,
  ClubDelegateEnum,
} from "@clubs/interface/common/enum/club.enum";

import logger from "@sparcs-clubs/api/common/util/logger";
import {
  getKSTDateForQuery,
  takeOne,
} from "@sparcs-clubs/api/common/util/util";
import { DrizzleAsyncProvider } from "@sparcs-clubs/api/drizzle/drizzle.provider";
import {
  ClubDelegate,
  ClubDelegateChangeRequest,
  ClubOld,
  ClubStudentT,
} from "@sparcs-clubs/api/drizzle/schema/club.schema";
import { Student, User } from "@sparcs-clubs/api/drizzle/schema/user.schema";

@Injectable()
export class ClubDelegateDRepository {
  constructor(@Inject(DrizzleAsyncProvider) private db: MySql2Database) {}

  /**
   * @param id 삭제할 변경 요청의 id
   */
  async deleteDelegateChangeRequestById(param: {
    id: number;
  }): Promise<boolean> {
    const [result] = await this.db
      .update(ClubDelegateChangeRequest)
      .set({
        deletedAt: getKSTDateForQuery(),
      })
      .where(eq(ClubDelegateChangeRequest.id, param.id));
    return result.affectedRows > 0;
  }

  /**
   * @param studentId 변경을 신청한 학생의 id
   * @returns 해당 학생이 신청한 변경 요청의 목록, 로직에 문제가 없다면 배열의 길이가 항상 1 이하여야 합니다.
   */
  async findDelegateChangeRequestByPrevStudentId(param: { studentId: number }) {
    const result = await this.db
      .select()
      .from(ClubDelegateChangeRequest)
      .where(
        and(
          eq(
            ClubDelegateChangeRequest.clubDelegateChangeRequestStatusEnumId,
            ClubDelegateChangeRequestStatusEnum.Applied,
          ),
          eq(ClubDelegateChangeRequest.prevStudentId, param.studentId),
          isNull(ClubDelegateChangeRequest.deletedAt),
        ),
      );
    return result;
  }

  /**
   * @param clubId 변경 신청을 조회하고자 하는 동아리의 id
   * @returns 해당 동아리의 모든 대표자 변경 요청의 목록
   * 3일 이내에 신청된 요청만을 조회합니다.
   * 최근에 신청된 요청이 가장 위에 위치합니다.
   */
  async findDelegateChangeRequestByClubId(param: { clubId: number }) {
    const result = await this.db
      .select()
      .from(ClubDelegateChangeRequest)
      .where(
        and(
          eq(ClubDelegateChangeRequest.clubId, param.clubId),
          isNull(ClubDelegateChangeRequest.deletedAt),
        ),
      )
      .orderBy(desc(ClubDelegateChangeRequest.createdAt));

    return result;
  }

  /**
   * @param id 변경 요청의 id
   *
   * @returns id가 일치하는 요청의 목록,
   id가 유일하기 때문에 배열의 길이가 항상 1 이하여야 합니다.
   */
  async findDelegateChangeRequestById(param: { id: number }) {
    const result = await this.db
      .select()
      .from(ClubDelegateChangeRequest)
      .where(
        and(
          eq(ClubDelegateChangeRequest.id, param.id),
          isNull(ClubDelegateChangeRequest.deletedAt),
        ),
      );
    return result;
  }

  /**
   * @param studentId 변경의 대상이 된 학생의 id
   * @returns 해당 학생이 변경의 대상이 된 요청의 목록, 로직에 문제가 없다면 배열의 길이가 항상 1 이하여야 합니다.
   * 3일 이내에 신청된 요청만을 조회합니다.
   */
  async findDelegateChangeRequestByStudentId(param: { studentId: number }) {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const result = await this.db
      .select()
      .from(ClubDelegateChangeRequest)
      .where(
        and(
          eq(
            ClubDelegateChangeRequest.clubDelegateChangeRequestStatusEnumId,
            ClubDelegateChangeRequestStatusEnum.Applied,
          ),
          eq(ClubDelegateChangeRequest.studentId, param.studentId),
          gte(ClubDelegateChangeRequest.createdAt, threeDaysAgo),
          isNull(ClubDelegateChangeRequest.deletedAt),
        ),
      );
    return result;
  }

  // 가장 최근 대표자의 이름을 가져오기
  async findRepresentativeName(
    clubId: number,
    startTerm?: Date,
  ): Promise<{ name: string }> {
    const currentDate = getKSTDateForQuery();

    const representative = await this.db
      .select({ name: Student.name })
      .from(ClubDelegate)
      .leftJoin(Student, eq(Student.id, ClubDelegate.studentId))
      .where(
        and(
          eq(ClubDelegate.clubId, clubId),
          eq(ClubDelegate.clubDelegateEnum, 1),
          lte(ClubDelegate.startTerm, startTerm || currentDate),
          or(
            gte(ClubDelegate.endTerm, startTerm || currentDate),
            isNull(ClubDelegate.endTerm),
          ),
        ),
      )
      .orderBy(ClubDelegate.endTerm)
      .limit(1)
      .then(takeOne);

    return representative;
  }

  /**
   * @param clubId 동아리 id
   * @returns 해당 동아리의 대표자 id 목록을 가져옵니다.
   */
  async findRepresentativeIdListByClubId(
    clubId: number,
  ): Promise<Array<{ studentId: number }>> {
    const result = await this.findDelegateByClubId(clubId);

    return result.map(e => ({ studentId: e.studentId }));
  }

  /**
   * @param clubId 동아리 id
   * @returns 해당 동아리의 대표자 정보 목록을 가져옵니다.
   */
  async findDelegateByClubId(clubId: number) {
    const currentDate = getKSTDateForQuery();

    const delegate = await this.db
      .select()
      .from(ClubDelegate)
      .where(
        and(
          eq(ClubDelegate.clubId, clubId),
          lte(ClubDelegate.startTerm, currentDate),
          or(
            gte(ClubDelegate.endTerm, currentDate),
            isNull(ClubDelegate.endTerm),
          ),
          isNull(ClubDelegate.deletedAt),
        ),
      )
      .orderBy(ClubDelegate.endTerm);

    return delegate;
  }

  /**
   * @param studentId 학생 id
   * @returns 해당 학생이 대표자 정보를 목록을 가져옵니다.
   * 로직에 문제가 없을경우 크기가 0 또는 1인 리스트가 리턴됩니다.
   */
  async findDelegateByStudentId(studentId: number) {
    const currentDate = getKSTDateForQuery();

    const delegate = await this.db
      .select()
      .from(ClubDelegate)
      .where(
        and(
          eq(ClubDelegate.studentId, studentId),
          lte(ClubDelegate.startTerm, currentDate),
          or(
            gte(ClubDelegate.endTerm, currentDate),
            isNull(ClubDelegate.endTerm),
          ),
          isNull(ClubDelegate.deletedAt),
        ),
      )
      .orderBy(ClubDelegate.endTerm);

    return delegate;
  }

  async findRepresentativeByClubIdAndStudentId(
    studentId: number,
    clubId: number,
  ): Promise<boolean> {
    const crt = getKSTDateForQuery();
    const result = !!(await this.db
      .select({ id: ClubDelegate.id })
      .from(ClubDelegate)
      .where(
        and(
          eq(ClubDelegate.clubId, clubId),
          eq(ClubDelegate.studentId, studentId),
          lte(ClubDelegate.startTerm, crt),
          or(gte(ClubDelegate.endTerm, crt), isNull(ClubDelegate.endTerm)),
        ),
      )
      .limit(1)
      .then(takeOne));
    return result;
  }

  /**
   * @param clubId
   * @param semesterId
   * @param filterClubDelegateEnum 후보자로 선정하기 위해 필터링되어야하는 ClubDelegateEnum 목록
   * 예를 들어, 대표자 후보를 얻기 위해 이 쿼리를 이용할 경우 filterClubDelegateEnum은 [filterClubDelegateEnum.Representative]
   * 가 되어야 합니다.
   * @returns 해당 동아리에서 해당 학기에 대표자 지위를 넘길 수 있는 학생 목록을 리턴합니다.
   */
  async selectDelegateCandidatesByClubId(param: {
    clubId: number;
    semesterId: number;
    filterClubDelegateEnum: Array<ClubDelegateEnum>;
  }) {
    const today = getKSTDateForQuery();
    logger.debug(param.semesterId);
    logger.debug(today);
    const result = await this.db
      .select()
      .from(ClubOld)
      .innerJoin(
        ClubStudentT,
        and(
          eq(ClubOld.id, ClubStudentT.clubId),
          isNull(ClubStudentT.deletedAt),
        ),
      )
      .innerJoin(
        Student,
        and(eq(ClubStudentT.studentId, Student.id), isNull(Student.deletedAt)),
      )
      .leftJoin(User, eq(User.id, Student.userId))
      .leftJoin(
        ClubDelegate,
        and(
          eq(ClubDelegate.studentId, Student.id),
          lte(ClubDelegate.startTerm, today),
          or(gte(ClubDelegate.endTerm, today), isNull(ClubDelegate.endTerm)),
          isNull(ClubDelegate.deletedAt),
        ),
      )
      .where(
        and(
          eq(ClubOld.id, param.clubId),
          eq(ClubStudentT.semesterId, param.semesterId),
          param.filterClubDelegateEnum.length !== 0
            ? or(
                notInArray(
                  ClubDelegate.clubDelegateEnum,
                  param.filterClubDelegateEnum,
                ),
                isNull(ClubDelegate.clubDelegateEnum),
              )
            : undefined,
          not(
            and(
              not(eq(ClubDelegate.clubId, param.clubId)),
              isNotNull(ClubDelegate.id),
            ),
          ),
          isNull(ClubOld.deletedAt),
        ),
      );
    // logger.debug(result); // 로그가 너무 길어서 주석처리해 두었어요
    return result;
  }

  /**
   * @param studentId 신청자 학생 Id
   * @param targetStudentId 변경 대상 학생 Id
   * @param clubId 동아리 Id
   * @param clubDelegateEnumId 대표자 지위 Id
   *
   * @description 동아리 대표자의 변경을 요청합니다.
   *
   * @returns insertion의 성공 여부를 리턴합니다.
   */
  async insertClubDelegateChangeRequest(param: {
    studentId: number;
    targetStudentId: number;
    clubId: number;
    clubDelegateEnumId: number;
  }): Promise<boolean> {
    const now = getKSTDateForQuery();

    const result = await this.db.transaction(async tx => {
      const [requestInsertionResult] = await tx
        .insert(ClubDelegateChangeRequest)
        .values({
          clubId: param.clubId,
          prevStudentId: param.studentId,
          studentId: param.targetStudentId,
          clubDelegateChangeRequestStatusEnumId:
            ClubDelegateChangeRequestStatusEnum.Applied,
          createdAt: now,
        });

      if (requestInsertionResult.affectedRows !== 1) {
        logger.debug("[insertClubDelegateChangeRequest] failed to insert");
        tx.rollback();
        return false;
      }

      return true;
    });

    return result;
  }

  /**
   * @param clubId 동아리 id
   * @param clubDelegateEnumId 대표자 분류 id
   * @param studentId 지정할 학생 id. undefined인 경우 지위만 해제시킵니다.
   *
   * @description 해당 학생을 동아리의 대표자로 지정합니다.
   * 기존에 해당 지위로 지정되었던 학생이 존재할 경우 지위가 해제됩니다.
   *
   * @returns 대의원 변경의 성공 여부를 리턴합니다.
   */
  async updateDelegate(param: {
    clubId: number;
    clubDelegateEnumId: number;
    studentId: number;
  }): Promise<boolean> {
    const now = getKSTDateForQuery();

    const result = await this.db.transaction(async tx => {
      // 기존 대표자의 임기를 종료
      const [prevDelegateUpdateResult] = await tx
        .update(ClubDelegate)
        .set({
          endTerm: now,
        })
        .where(
          and(
            eq(ClubDelegate.clubId, param.clubId),
            eq(ClubDelegate.clubDelegateEnum, param.clubDelegateEnumId),
            lte(ClubDelegate.startTerm, now),
            or(gte(ClubDelegate.endTerm, now), isNull(ClubDelegate.endTerm)),
            isNull(ClubDelegate.deletedAt),
          ),
        );
      // 신규 delegate가 맡고 있던 지위를 해제
      const [delegateUpdateResult] = await tx
        .update(ClubDelegate)
        .set({
          endTerm: now,
        })
        .where(
          and(
            eq(ClubDelegate.clubId, param.clubId),
            eq(ClubDelegate.studentId, param.studentId),
            lte(ClubDelegate.startTerm, now),
            or(gte(ClubDelegate.endTerm, now), isNull(ClubDelegate.endTerm)),
            isNull(ClubDelegate.deletedAt),
          ),
        );
      // 변경된 row는 각각 0줄 또는 한줄이어야 합니다.
      if (
        prevDelegateUpdateResult.affectedRows > 1 ||
        delegateUpdateResult.affectedRows > 1
      ) {
        const errorReason =
          prevDelegateUpdateResult.affectedRows > 1
            ? "Previous Delegate"
            : "New Delegate";
        logger.debug(
          `[updateDelegate] ${errorReason}: more than 1 row is modified. Rollback.`,
        );
        tx.rollback();
        return false;
      }

      if (param.studentId === 0) return true;

      const [delegateInsertResult] = await tx.insert(ClubDelegate).values({
        clubId: param.clubId,
        studentId: param.studentId,
        clubDelegateEnum: param.clubDelegateEnumId,
        startTerm: now,
      });
      if (delegateInsertResult.affectedRows !== 1) {
        logger.debug("[updateDelegate] insertion is failed Rollback.");
        tx.rollback();
        return false;
      }

      return true;
    });

    return result;
  }

  async updateClubDelegateChangeRequest(param: {
    id: number;
    clubDelegateChangeRequestStatusEnumId: ClubDelegateChangeRequestStatusEnum;
  }): Promise<boolean> {
    const [result] = await this.db
      .update(ClubDelegateChangeRequest)
      .set({
        clubDelegateChangeRequestStatusEnumId:
          param.clubDelegateChangeRequestStatusEnumId,
      })
      .where(eq(ClubDelegateChangeRequest.id, param.id));

    return result.affectedRows === 1;
  }

  async isPresidentByStudentIdAndClubId(studentId: number, clubId: number) {
    const cur = getKSTDateForQuery();
    const presidentEnumId = ClubDelegateEnum.Representative;
    const { president } = await this.db
      .select({ president: count(ClubDelegate.id) })
      .from(ClubDelegate)
      .where(
        and(
          eq(ClubDelegate.studentId, studentId),
          eq(ClubDelegate.clubId, clubId),
          eq(ClubDelegate.clubDelegateEnum, presidentEnumId),
          lte(ClubDelegate.startTerm, cur),
          or(gte(ClubDelegate.endTerm, cur), isNull(ClubDelegate.endTerm)),
          isNull(ClubDelegate.deletedAt),
        ),
      )
      .then(takeOne);
    if (president !== 0) return true;
    return false;
  }
}
