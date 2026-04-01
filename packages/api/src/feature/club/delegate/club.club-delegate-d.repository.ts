import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import {
  ClubDelegateChangeRequestStatusEnum,
  ClubDelegateEnum,
} from "@clubs/interface/common/enum/club.enum";

import logger from "@sparcs-clubs/api/common/util/logger";
import { takeOne } from "@sparcs-clubs/api/common/util/util";
import { syncDelegateMemberRegistrations } from "@sparcs-clubs/api/feature/registration/util/sync-delegate-member-registrations";
import { PrismaService } from "@sparcs-clubs/api/prisma/prisma.service";

@Injectable()
export class ClubDelegateDRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * @param id 삭제할 변경 요청의 id
   */
  async deleteDelegateChangeRequestById(param: {
    id: number;
  }): Promise<boolean> {
    const result = await this.prisma.clubDelegateChangeRequest.updateMany({
      where: { id: param.id },
      data: { deletedAt: new Date() },
    });
    return result.count > 0;
  }

  /**
   * @param studentId 변경을 신청한 학생의 id
   * @returns 해당 학생이 신청한 변경 요청의 목록, 로직에 문제가 없다면 배열의 길이가 항상 1 이하여야 합니다.
   */
  async findDelegateChangeRequestByPrevStudentId(param: { studentId: number }) {
    const result = await this.prisma.clubDelegateChangeRequest.findMany({
      where: {
        clubDelegateChangeRequestStatusEnumId:
          ClubDelegateChangeRequestStatusEnum.Applied,
        prevStudentId: param.studentId,
        deletedAt: null,
      },
    });
    return result;
  }

  /**
   * @param clubId 변경 신청을 조회하고자 하는 동아리의 id
   * @returns 해당 동아리의 모든 대표자 변경 요청의 목록
   * 3일 이내에 신청된 요청만을 조회합니다.
   * 최근에 신청된 요청이 가장 위에 위치합니다.
   */
  async findDelegateChangeRequestByClubId(param: { clubId: number }) {
    const result = await this.prisma.clubDelegateChangeRequest.findMany({
      where: {
        clubId: param.clubId,
        deletedAt: null,
      },
      orderBy: { createdAt: "desc" },
    });

    return result;
  }

  /**
   * @param id 변경 요청의 id
   *
   * @returns id가 일치하는 요청의 목록,
   id가 유일하기 때문에 배열의 길이가 항상 1 이하여야 합니다.
   */
  async findDelegateChangeRequestById(param: { id: number }) {
    const result = await this.prisma.clubDelegateChangeRequest.findMany({
      where: {
        id: param.id,
        deletedAt: null,
      },
    });
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

    const result = await this.prisma.clubDelegateChangeRequest.findMany({
      where: {
        clubDelegateChangeRequestStatusEnumId:
          ClubDelegateChangeRequestStatusEnum.Applied,
        studentId: param.studentId,
        createdAt: { gte: threeDaysAgo },
        deletedAt: null,
      },
    });
    return result;
  }

  // 가장 최근 대표자의 이름을 가져오기
  async findRepresentativeName(
    clubId: number,
    startTerm?: Date,
  ): Promise<{ name: string }> {
    const query = startTerm
      ? Prisma.sql`
          SELECT s.name
          FROM club_delegate_d cd
          LEFT JOIN student s ON s.id = cd.student_id
          WHERE cd.club_id = ${clubId}
            AND cd.club_delegate_enum_id = 1
            AND cd.start_term <= ${startTerm}
            AND (cd.end_term >= ${startTerm} OR cd.end_term IS NULL)
          ORDER BY cd.end_term
          LIMIT 1
        `
      : Prisma.sql`
          SELECT s.name
          FROM club_delegate_d cd
          LEFT JOIN student s ON s.id = cd.student_id
          WHERE cd.club_id = ${clubId}
            AND cd.club_delegate_enum_id = 1
            AND cd.start_term <= NOW()
            AND (cd.end_term >= NOW() OR cd.end_term IS NULL)
          ORDER BY cd.end_term
          LIMIT 1
        `;

    const result = await this.prisma.$queryRaw<Array<{ name: string }>>(query);

    return takeOne(result);
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
    const currentDate = new Date();

    const delegate = await this.prisma.clubDelegateD.findMany({
      where: {
        clubId,
        startTerm: { lte: currentDate },
        OR: [{ endTerm: { gte: currentDate } }, { endTerm: null }],
        deletedAt: null,
      },
      orderBy: { endTerm: "asc" },
    });

    return delegate;
  }

  /**
   * @param studentId 학생 id
   * @returns 해당 학생이 대표자 정보를 목록을 가져옵니다.
   * 로직에 문제가 없을경우 크기가 0 또는 1인 리스트가 리턴됩니다.
   */
  async findDelegateByStudentId(studentId: number) {
    const currentDate = new Date();

    const delegate = await this.prisma.clubDelegateD.findMany({
      where: {
        studentId,
        startTerm: { lte: currentDate },
        OR: [{ endTerm: { gte: currentDate } }, { endTerm: null }],
        deletedAt: null,
      },
      orderBy: { endTerm: "asc" },
    });

    return delegate;
  }

  async findRepresentativeByClubIdAndStudentId(
    studentId: number,
    clubId: number,
  ): Promise<boolean> {
    const crt = new Date();
    const result = await this.prisma.clubDelegateD.findFirst({
      where: {
        clubId,
        studentId,
        startTerm: { lte: crt },
        OR: [{ endTerm: { gte: crt } }, { endTerm: null }],
      },
      select: { id: true },
    });
    return !!result;
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
    logger.debug(param.semesterId);

    const filterEnums = param.filterClubDelegateEnum;
    const hasFilter = filterEnums.length !== 0;

    // Build the filter clause for club_delegate_enum_id
    const filterClause = hasFilter
      ? Prisma.sql`AND (cd.club_delegate_enum_id NOT IN (${Prisma.join(filterEnums)}) OR cd.club_delegate_enum_id IS NULL)`
      : Prisma.empty;

    const result = await this.prisma.$queryRaw<
      Array<{
        studentId: number;
        studentNumber: number;
        studentName: string;
        phoneNumber: string | null;
      }>
    >(
      Prisma.sql`
        SELECT
          s.id AS studentId,
          s.number AS studentNumber,
          s.name AS studentName,
          u.phone_number AS phoneNumber
        FROM club c
        INNER JOIN club_student_t cst
          ON c.id = cst.club_id
          AND cst.deleted_at IS NULL
        INNER JOIN student s
          ON cst.student_id = s.id
          AND s.deleted_at IS NULL
        LEFT JOIN user u
          ON u.id = s.user_id
        LEFT JOIN club_delegate_d cd
          ON cd.student_id = s.id
          AND cd.start_term <= NOW()
          AND (cd.end_term >= NOW() OR cd.end_term IS NULL)
          AND cd.deleted_at IS NULL
        WHERE c.id = ${param.clubId}
          AND cst.semester_id = ${param.semesterId}
          ${filterClause}
          AND NOT (cd.club_id != ${param.clubId} AND cd.id IS NOT NULL)
          AND c.deleted_at IS NULL
      `,
    );

    // logger.debug(result); // 로그가 너무 길어서 주석처리해 두었어요
    return result.map(e => ({
      student: {
        id: e.studentId,
        number: e.studentNumber,
        name: e.studentName,
      },
      user: {
        phoneNumber: e.phoneNumber,
      },
    }));
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
    const now = new Date();

    const result = await this.prisma.$transaction<boolean>(async tx => {
      const requestInsertionResult = await tx.clubDelegateChangeRequest.create({
        data: {
          clubId: param.clubId,
          prevStudentId: param.studentId,
          studentId: param.targetStudentId,
          clubDelegateChangeRequestStatusEnumId:
            ClubDelegateChangeRequestStatusEnum.Applied,
          createdAt: now,
        },
      });

      if (!requestInsertionResult) {
        logger.debug("[insertClubDelegateChangeRequest] failed to insert");
        throw new Error("insertClubDelegateChangeRequest failed");
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
    const now = new Date();

    const result = await this.prisma.$transaction<boolean>(async tx => {
      // 기존 대표자의 임기를 종료
      const prevDelegateUpdateResult = await tx.clubDelegateD.updateMany({
        where: {
          clubId: param.clubId,
          clubDelegateEnum: param.clubDelegateEnumId,
          startTerm: { lte: now },
          OR: [{ endTerm: { gte: now } }, { endTerm: null }],
          deletedAt: null,
        },
        data: { endTerm: now },
      });

      // 신규 delegate가 맡고 있던 지위를 해제
      const delegateUpdateResult = await tx.clubDelegateD.updateMany({
        where: {
          clubId: param.clubId,
          studentId: param.studentId,
          startTerm: { lte: now },
          OR: [{ endTerm: { gte: now } }, { endTerm: null }],
          deletedAt: null,
        },
        data: { endTerm: now },
      });

      // 변경된 row는 각각 0줄 또는 한줄이어야 합니다.
      if (
        prevDelegateUpdateResult.count > 1 ||
        delegateUpdateResult.count > 1
      ) {
        const errorReason =
          prevDelegateUpdateResult.count > 1
            ? "Previous Delegate"
            : "New Delegate";
        logger.debug(
          `[updateDelegate] ${errorReason}: more than 1 row is modified. Rollback.`,
        );
        throw new Error(
          `[updateDelegate] ${errorReason}: more than 1 row is modified.`,
        );
      }

      if (param.studentId === 0) return true;

      const delegateInsertResult = await tx.clubDelegateD.create({
        data: {
          clubId: param.clubId,
          studentId: param.studentId,
          clubDelegateEnum: param.clubDelegateEnumId,
          startTerm: now,
        },
      });

      if (!delegateInsertResult) {
        logger.debug("[updateDelegate] insertion is failed Rollback.");
        throw new Error("[updateDelegate] insertion failed");
      }

      const currentSemester = await tx.semesterD.findFirst({
        where: {
          startTerm: { lte: now },
          endTerm: { gte: now },
          deletedAt: null,
        },
      });

      if (currentSemester) {
        const clubT = await tx.clubT.findFirst({
          where: {
            clubId: param.clubId,
            semesterId: currentSemester.id,
            deletedAt: null,
          },
          select: {
            startTerm: true,
            endTerm: true,
          },
        });

        if (clubT) {
          await syncDelegateMemberRegistrations({
            tx,
            clubId: param.clubId,
            semesterId: currentSemester.id,
            startTerm: clubT.startTerm,
            endTerm: clubT.endTerm,
            studentIds: [param.studentId],
            referenceDate: now,
          });
        }
      }

      return true;
    });

    return result;
  }

  async updateClubDelegateChangeRequest(param: {
    id: number;
    clubDelegateChangeRequestStatusEnumId: ClubDelegateChangeRequestStatusEnum;
  }): Promise<boolean> {
    const result = await this.prisma.clubDelegateChangeRequest.updateMany({
      where: { id: param.id },
      data: {
        clubDelegateChangeRequestStatusEnumId:
          param.clubDelegateChangeRequestStatusEnumId,
      },
    });

    return result.count === 1;
  }

  async isPresidentByStudentIdAndClubId(studentId: number, clubId: number) {
    const cur = new Date();
    const presidentEnumId = ClubDelegateEnum.Representative;
    const president = await this.prisma.clubDelegateD.count({
      where: {
        studentId,
        clubId,
        clubDelegateEnum: presidentEnumId,
        startTerm: { lte: cur },
        OR: [{ endTerm: { gte: cur } }, { endTerm: null }],
        deletedAt: null,
      },
    });
    if (president !== 0) return true;
    return false;
  }

  async findUserIdByStudentId(studentId: number) {
    const result = await this.prisma.student.findMany({
      where: { id: studentId, deletedAt: null },
      select: { userId: true },
    });
    return takeOne(result).userId;
  }
}
