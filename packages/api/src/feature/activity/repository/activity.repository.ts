import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { and, asc, desc, eq, exists, inArray, isNull, or } from "drizzle-orm";
import { MySql2Database } from "drizzle-orm/mysql2";

import { IActivitySummary } from "@clubs/interface/api/activity/type/activity.type";
import {
  ActivityStatusEnum,
  ActivityTypeEnum,
} from "@clubs/interface/common/enum/activity.enum";

import logger from "@sparcs-clubs/api/common/util/logger";
import { getKSTDate } from "@sparcs-clubs/api/common/util/util";
import {
  DrizzleAsyncProvider,
  DrizzleTransaction,
} from "@sparcs-clubs/api/drizzle/drizzle.provider";
import {
  Activity,
  ActivityClubChargedExecutive,
  ActivityEvidenceFile,
  ActivityFeedback,
  ActivityParticipant,
  ActivityT,
  ProfessorSignStatus,
} from "@sparcs-clubs/api/drizzle/schema/activity.schema";
import { ClubOld, ClubT } from "@sparcs-clubs/api/drizzle/schema/club.schema";
import { Division } from "@sparcs-clubs/api/drizzle/schema/division.schema";
import {
  Professor,
  Student,
} from "@sparcs-clubs/api/drizzle/schema/user.schema";

import { MActivity } from "../model/activity.model";
import { VActivitySummary } from "../model/activity.summary.model";

@Injectable()
export default class ActivityRepository {
  constructor(@Inject(DrizzleAsyncProvider) private db: MySql2Database) {}

  async withTransaction<Result>(
    callback: (tx: DrizzleTransaction) => Promise<Result>,
  ): Promise<Result> {
    return this.db.transaction(callback);
  }

  selectActivityByIds(activityIds: number[]) {
    return this.db
      .select()
      .from(Activity)
      .where(inArray(Activity.id, activityIds));
  }

  updateActivityProfessorApprovedAt(param: {
    activityIds: number[];
    professorId: number;
  }) {
    const today = getKSTDate();

    return this.db
      .update(Activity)
      .set({ professorApprovedAt: today })
      .where(inArray(Activity.id, param.activityIds));
  }

  // 활동을 DB에서 soft delete 합니다.
  // 작성에 성공하면 True, 실패하면 False를 리턴합니다.
  async deleteActivity(contents: { activityId: number }): Promise<boolean> {
    const isDeletionSucceed = await this.db.transaction(async tx => {
      const deletedAt = getKSTDate();
      const [activitySetResult] = await tx
        .update(Activity)
        .set({
          deletedAt,
          editedAt: deletedAt,
        })
        .where(
          and(eq(Activity.id, contents.activityId), isNull(Activity.deletedAt)),
        );

      if (activitySetResult.affectedRows !== 1) {
        logger.debug(
          "[deleteActivity] activity deletion failed. Rollback occurs",
        );
        tx.rollback();
        return false;
      }

      const [participantSetResult] = await tx
        .update(ActivityParticipant)
        .set({
          deletedAt,
        })
        .where(
          and(
            eq(ActivityParticipant.activityId, contents.activityId),
            isNull(ActivityParticipant.deletedAt),
          ),
        );
      if (participantSetResult.affectedRows < 1) {
        logger.debug(
          "[deleteActivity] student deletion failed. Rollback occurs",
        );
        tx.rollback();
        return false;
      }

      const [durationSetResult] = await tx
        .update(ActivityT)
        .set({
          deletedAt,
        })
        .where(
          and(
            eq(ActivityT.activityId, contents.activityId),
            isNull(ActivityT.deletedAt),
          ),
        );
      if (durationSetResult.affectedRows < 1) {
        logger.debug(
          "[deleteActivity] duration deletion failed. Rollback occurs",
        );
        tx.rollback();
        return false;
      }

      const [fileSetResult] = await tx
        .update(ActivityEvidenceFile)
        .set({
          deletedAt,
        })
        .where(
          and(
            eq(ActivityEvidenceFile.activityId, contents.activityId),
            isNull(ActivityEvidenceFile.deletedAt),
          ),
        );
      if (fileSetResult.affectedRows < 1) {
        logger.debug("[deleteActivity] file deletion failed. Rollback occurs");
        tx.rollback();
        return false;
      }

      await tx
        .update(ActivityFeedback)
        .set({
          deletedAt,
        })
        .where(
          and(
            eq(ActivityFeedback.activityId, contents.activityId),
            isNull(ActivityFeedback.deletedAt),
          ),
        );
      // feedback은 아직 없을수도 있어서 롤백이 없어요

      return true;
    });

    return isDeletionSucceed;
  }

  // 새로운 활동을 DB에 작성합니다.
  // 작성에 성공하면 True, 실패하면 False를 리턴합니다.
  async insertActivity(contents: {
    clubId: number;
    name: string;
    activityTypeEnumId: ActivityTypeEnum;
    duration: Array<{
      startTerm: Date;
      endTerm: Date;
    }>;
    location: string;
    purpose: string;
    detail: string;
    evidence: string;
    evidenceFileIds: Array<string>;
    participantIds: Array<number>;
    activityDId: number;
  }): Promise<boolean> {
    const isInsertionSucceed = await this.db.transaction(async tx => {
      const [activityInsertResult] = await tx.insert(Activity).values({
        clubId: contents.clubId,
        originalName: contents.name,
        name: contents.name,
        activityStatusEnumId: Number(ActivityStatusEnum.Applied),
        location: contents.location,
        purpose: contents.purpose,
        detail: contents.detail,
        evidence: contents.evidence,
        activityDId: contents.activityDId,
        activityTypeEnumId: Number(contents.activityTypeEnumId),
      });
      if (activityInsertResult.affectedRows !== 1) {
        logger.debug("[insertActivity] rollback occurs");
        tx.rollback();
        return false;
      }

      logger.debug(
        `[insertActivity] New activity inserted with id ${activityInsertResult.insertId}`,
      );

      await Promise.all(
        contents.participantIds.map(async studentId => {
          const [studentInsertResult] = await tx
            .insert(ActivityParticipant)
            .values({
              activityId: activityInsertResult.insertId,
              studentId,
            });

          if (studentInsertResult.affectedRows !== 1) {
            logger.debug(
              "[insertActivity] student insert failed. Rollback occurs",
            );
            tx.rollback();
            return false;
          }
          return {};
        }),
      );

      await Promise.all(
        contents.duration.map(async ({ startTerm, endTerm }) => {
          const [durationInsertResult] = await tx.insert(ActivityT).values({
            activityId: activityInsertResult.insertId,
            startTerm,
            endTerm,
          });

          if (durationInsertResult.affectedRows !== 1) {
            logger.debug(
              "[insertActivity] duration insert failed. Rollback occurs",
            );
            tx.rollback();
            return false;
          }
          return {};
        }),
      );

      await Promise.all(
        contents.evidenceFileIds.map(async fileId => {
          const [fileInsertResult] = await tx
            .insert(ActivityEvidenceFile)
            .values({
              activityId: activityInsertResult.insertId,
              fileId,
            });

          if (fileInsertResult.affectedRows !== 1) {
            logger.debug(
              "[insertActivity] FileId insert failed. Rollback occurs",
            );
            tx.rollback();
            return false;
          }
          return {};
        }),
      );

      const [signInsertResult] = await tx
        .insert(ProfessorSignStatus)
        // TODO: 교수님 사인도 activityD로 맞추기
        .values({ clubId: contents.clubId, semesterId: contents.activityDId });
      if (signInsertResult.affectedRows !== 1) {
        logger.debug("[insertActivity] FileId insert failed. Rollback occurs");
        tx.rollback();
        return false;
      }

      return true;
    });

    return isInsertionSucceed;
  }

  // /**
  //  * @param param
  //  * @description 동아리활동 반려 사유를 생성합니다.
  //  * activityId와 activityId의의 유효성을 검사하지 않습니다.
  //  * @returns 생성의 성공 여부를 boolean으로 리턴합니다.
  //  */
  // async insertActivityFeedback(param: {
  //   activityId: number;
  //   comment: string;
  //   executiveId: number;
  // }): Promise<boolean> {
  //   const isInsertionSucceed = await this.db.transaction(async tx => {
  //     const [insertionResult] = await tx.insert(ActivityFeedback).values({
  //       activityId: param.activityId,
  //       comment: param.comment,
  //       executiveId: param.executiveId,
  //     });
  //     if (insertionResult.affectedRows > 1)
  //       throw new HttpException(
  //         "unreachable",
  //         HttpStatus.INTERNAL_SERVER_ERROR,
  //       );
  //     if (insertionResult.affectedRows === 0) return false;

  //     return true;
  //   });

  //   return isInsertionSucceed;
  // }

  async selectActivityByActivityId(activityId: number) {
    const result = await this.db
      .select()
      .from(Activity)
      .where(and(eq(Activity.id, activityId), isNull(Activity.deletedAt)));
    return result;
  }

  async selectActivityByActivityDId(activityDId: number) {
    const result = await this.db
      .select()
      .from(Activity)
      .where(
        and(eq(Activity.activityDId, activityDId), isNull(Activity.deletedAt)),
      );
    return result;
  }

  /**
   * @param clubId 동아리 ID
   * @description 가동아리 활보 작성은 하나의 기간만 존재하기에
   * clubId기준으로 한번에 가져오기 위한 쿼리입니다.
   * @returns 해당 동아리가 적은 삭제되지 않은 모든 활동을 가져옵니다.
   */
  async selectActivityByClubId(param: { clubId: number }) {
    const result = await this.db
      .select()
      .from(Activity)
      .where(
        and(eq(Activity.clubId, param.clubId), isNull(Activity.deletedAt)),
      );
    return result;
  }

  async selectActivityByClubIdAndActivityDId(
    clubId: number,
    activityDId: number,
  ) {
    const result = await this.db
      .select()
      .from(Activity)
      .where(
        and(
          eq(Activity.clubId, clubId),
          eq(Activity.activityDId, activityDId),
          isNull(Activity.deletedAt),
        ),
      );
    return result;
  }

  /**
   * @param param
   * @returns activityId를 기준으로 반려 피드백 리스트를 리턴합니다.
   * 급하게 짜서 오류있는지 점검필요 으어ㅏ
   */
  async selectActivityFeedbackByActivityId(param: { activityId: number }) {
    const result = await this.db
      .select()
      .from(ActivityFeedback)
      .where(
        and(
          eq(ActivityFeedback.activityId, param.activityId),
          isNull(ActivityFeedback.deletedAt),
        ),
      );
    return result;
  }

  async selectFileByActivityId(activityId: number) {
    const result = await this.db
      .select()
      .from(ActivityEvidenceFile)
      .where(
        and(
          eq(ActivityEvidenceFile.activityId, activityId),
          isNull(ActivityEvidenceFile.deletedAt),
        ),
      );
    return result;
  }

  async selectDurationByActivityId(activityId: number) {
    const result = await this.db
      .select()
      .from(ActivityT)
      .where(
        and(eq(ActivityT.activityId, activityId), isNull(ActivityT.deletedAt)),
      )
      .orderBy(asc(ActivityT.startTerm), asc(ActivityT.endTerm));

    return result;
  }

  async selectParticipantByActivityId(activityId: number) {
    const result = await this.db
      .select({
        studentId: ActivityParticipant.studentId,
        studentNumber: Student.number,
        name: Student.name,
      })
      .from(ActivityParticipant)
      .leftJoin(Student, eq(ActivityParticipant.studentId, Student.id))
      .where(
        and(
          eq(ActivityParticipant.activityId, activityId),
          isNull(ActivityParticipant.deletedAt),
        ),
      );

    return result;
  }

  async updateActivity(param: {
    activityId: number;
    name: string;
    activityTypeEnumId: ActivityTypeEnum;
    duration: Array<{
      startTerm: Date;
      endTerm: Date;
    }>;
    location: string;
    purpose: string;
    detail: string;
    evidence: string;
    evidenceFileIds: Array<string>;
    participantIds: Array<number>;
    activityDId: number;
    activityStatusEnumId: ActivityStatusEnum;
  }) {
    const isUpdateSucceed = await this.db.transaction(async tx => {
      const deletedAt = getKSTDate();

      const [activitySetResult] = await tx
        .update(Activity)
        .set({
          name: param.name,
          activityTypeEnumId: Number(param.activityTypeEnumId),
          location: param.location,
          purpose: param.purpose,
          detail: param.detail,
          evidence: param.evidence,
          activityDId: param.activityDId,
          activityStatusEnumId: Number(param.activityStatusEnumId),
          editedAt: deletedAt,
        })
        .where(eq(Activity.id, param.activityId));
      if (activitySetResult.affectedRows !== 1) {
        logger.debug("[updateActivity] rollback occurs");
        tx.rollback();
        return false;
      }

      // 참가자 전체 삭제 및 재생성
      const [participantDeletionResult] = await tx
        .update(ActivityParticipant)
        .set({
          deletedAt,
        })
        .where(
          and(
            eq(ActivityParticipant.activityId, param.activityId),
            isNull(ActivityParticipant.deletedAt),
          ),
        );
      if (participantDeletionResult.affectedRows < 1) {
        logger.debug(
          "[deleteActivity] student deletion failed. Rollback occurs",
        );
        tx.rollback();
        return false;
      }
      await Promise.all(
        param.participantIds.map(async studentId => {
          const [studentSetResult] = await tx
            .insert(ActivityParticipant)
            .values({
              activityId: param.activityId,
              studentId,
            });

          if (studentSetResult.affectedRows !== 1) {
            logger.debug(
              "[updateActivity] student insert failed. Rollback occurs",
            );
            tx.rollback();
            return false;
          }
          return {};
        }),
      );

      // 기간 전체 삭제 및 재생성
      const [durationDeletionResult] = await tx
        .update(ActivityT)
        .set({
          deletedAt,
        })
        .where(
          and(
            eq(ActivityT.activityId, param.activityId),
            isNull(ActivityT.deletedAt),
          ),
        );
      if (durationDeletionResult.affectedRows < 1) {
        logger.debug(
          "[deleteActivity] duration deletion failed. Rollback occurs",
        );
        tx.rollback();
        return false;
      }
      await Promise.all(
        param.duration.map(async ({ startTerm, endTerm }) => {
          const [durationInsertResult] = await tx.insert(ActivityT).values({
            activityId: param.activityId,
            startTerm,
            endTerm,
          });

          if (durationInsertResult.affectedRows < 1) {
            logger.debug(
              "[updateActivity] duration insert failed. Rollback occurs",
            );
            tx.rollback();
            return false;
          }
          return {};
        }),
      );

      // 근거 자료 전체 삭제 및 재생성
      const [fileDeletionResult] = await tx
        .update(ActivityEvidenceFile)
        .set({
          deletedAt,
        })
        .where(
          and(
            eq(ActivityEvidenceFile.activityId, param.activityId),
            isNull(ActivityEvidenceFile.deletedAt),
          ),
        );
      if (fileDeletionResult.affectedRows < 1) {
        logger.debug("[deleteActivity] file deletion failed. Rollback occurs");
        tx.rollback();
        return false;
      }
      await Promise.all(
        param.evidenceFileIds.map(async fileId => {
          const [fileInsertResult] = await tx
            .insert(ActivityEvidenceFile)
            .values({
              activityId: param.activityId,
              fileId,
            });

          if (fileInsertResult.affectedRows < 1) {
            logger.debug(
              "[updateActivity] FileId insert failed. Rollback occurs",
            );
            tx.rollback();
            return false;
          }
          return {};
        }),
      );

      return true;
    });

    return isUpdateSucceed;
  }

  async selectActivityNameById(id: number) {
    const result = await this.db
      .select({ name: Activity.name, id: Activity.id })
      .from(Activity)
      .where(eq(Activity.id, id));
    return result[0];
  }

  async fetchSummary(id: number): Promise<IActivitySummary> {
    const result = await this.db
      .select()
      .from(Activity)
      .where(eq(Activity.id, id));

    if (result.length !== 1) {
      throw new NotFoundException("Activity not found");
    }

    return VActivitySummary.fromDBResult(result[0]);
  }

  async fetchSummaries(activityIds: number[]): Promise<IActivitySummary[]> {
    if (activityIds.length === 0) return [];
    const results = await this.db
      .select()
      .from(Activity)
      .where(inArray(Activity.id, activityIds));
    return results.map(result => VActivitySummary.fromDBResult(result));
  }

  /**
   * @param activityId 활동 Id
   * @description 해당 활동의 승인 상태(ActivityStatusEnumId)를 변경합니다.
   * 해당 활동의 상태가 이미 승인인 경우 예외(Bad Request)를 발생시킵니다.
   * @returns update에 성공했는지 성공여부를 리턴합니다.
   * 이미 해당 activity의 enumId가 동알할 경우 false를 리턴합니다.
   * 이 외의실패시 예외가 발생하여 항상 true를 리턴해야 합니다.
   */
  async updateActivityStatusEnumId(param: {
    activityId: number;
    activityStatusEnumId: ActivityStatusEnum;
  }): Promise<boolean> {
    const isUpdateSucceed = await this.db.transaction(async tx => {
      const activities = await tx
        .select()
        .from(Activity)
        .where(
          and(eq(Activity.id, param.activityId), isNull(Activity.deletedAt)),
        );
      if (activities.length === 0)
        throw new HttpException("not found", HttpStatus.NOT_FOUND);
      if (activities[0].activityStatusEnumId === param.activityStatusEnumId)
        return false;
      const [updateResult] = await tx
        .update(Activity)
        .set({
          activityStatusEnumId: param.activityStatusEnumId,
          commentedAt: getKSTDate(),
        })
        .where(
          and(eq(Activity.id, param.activityId), isNull(Activity.deletedAt)),
        );
      if (updateResult.affectedRows !== 1)
        throw new HttpException(
          "failed to update activityStatusEnumId",
          HttpStatus.BAD_REQUEST,
        );
      return true;
    });
    return isUpdateSucceed;
  }

  /**
   * @param activityId 활동 Id
   * @param executiveId 집행부원 Id
   * @description 해당 활동의 담당 집행부원을 변경합니다.
   * @returns update에 성공했는지 성공여부를 리턴합니다.
   */
  async updateActivityChargedExecutive(param: {
    activityId: number;
    executiveId: number;
  }): Promise<boolean> {
    const [updateResult] = await this.db
      .update(Activity)
      .set({
        chargedExecutiveId: param.executiveId,
      })
      .where(
        and(eq(Activity.id, param.activityId), isNull(Activity.deletedAt)),
      );

    return updateResult.warningStatus === 0;
  }

  /**
   *
   * @param param
   * @description 서비스 getExecutiveActivitiesClubs 메소드에서 이용되는 전용 메소드입니다.
   */
  async getExecutiveActivitiesClubs(param: {
    semesterId: number;
    activityDId: number;
    clubsList: number[];
  }) {
    const result = await this.db
      .select({
        clubId: ClubOld.id,
        clubTypeEnum: ClubT.clubStatusEnumId,
        divisionName: Division.name,
        clubNameKr: ClubOld.nameKr,
        clubNameEn: ClubOld.nameEn,
        advisor: Professor.name,
        chargedExecutiveId: ActivityClubChargedExecutive.executiveId,
      })
      .from(ClubOld)
      .innerJoin(
        ClubT,
        and(
          eq(ClubT.clubId, ClubOld.id),
          eq(ClubT.semesterId, param.semesterId),
          isNull(ClubT.deletedAt),
        ),
      )
      .innerJoin(
        Division,
        and(eq(Division.id, ClubOld.divisionId), isNull(Division.deletedAt)),
      )
      .leftJoin(
        Professor,
        and(eq(Professor.id, ClubT.professorId), isNull(Professor.deletedAt)),
      )
      .leftJoin(
        ActivityClubChargedExecutive,
        and(
          eq(ActivityClubChargedExecutive.clubId, ClubOld.id),
          eq(ActivityClubChargedExecutive.activityDId, param.activityDId),
          isNull(ActivityClubChargedExecutive.deletedAt),
        ),
      )
      .where(
        and(inArray(ClubOld.id, param.clubsList), isNull(ClubOld.deletedAt)),
      );
    return result;
  }

  async fetchCommentedSummaries(
    executiveId: number,
  ): Promise<VActivitySummary[]> {
    const latestFeedbacks = this.db
      .select({
        activityId: ActivityFeedback.activityId,
        executiveId: ActivityFeedback.executiveId,
      })
      .from(ActivityFeedback)
      .where(
        and(
          eq(ActivityFeedback.executiveId, executiveId),
          isNull(ActivityFeedback.deletedAt),
        ),
      )
      .orderBy(desc(ActivityFeedback.createdAt))
      .as("latest_feedbacks");

    const results = await this.db
      .select({
        id: Activity.id,
        activityStatusEnumId: Activity.activityStatusEnumId,
        activityTypeEnumId: Activity.activityTypeEnumId,
        clubId: Activity.clubId,
        name: Activity.name,
        commentedAt: Activity.commentedAt,
        editedAt: Activity.editedAt,
        updatedAt: Activity.updatedAt,
        chargedExecutiveId: Activity.chargedExecutiveId,
        commentedExecutiveId: latestFeedbacks.executiveId,
      })
      .from(Activity)
      .leftJoin(latestFeedbacks, eq(latestFeedbacks.activityId, Activity.id))
      .where(
        and(
          isNull(Activity.deletedAt),
          or(
            eq(Activity.chargedExecutiveId, executiveId),
            exists(
              this.db
                .select()
                .from(ActivityFeedback)
                .where(
                  and(
                    eq(ActivityFeedback.activityId, Activity.id),
                    eq(ActivityFeedback.executiveId, executiveId),
                    isNull(ActivityFeedback.deletedAt),
                  ),
                ),
            ),
          ),
        ),
      );

    return results.map(result => VActivitySummary.fromDBResult(result));
  }

  /**
   * @param clubId
   * @param semesterId
   * @description 해당학기의 선택가능한 ActivitySummary를 반환합니다.
   * 선택가능한 활동이란, 승인되거나 운위로 넘겨진 경우를 의미합니다.
   */

  async fetchAvailableSummaries(
    clubId: number,
    activityDId: number,
  ): Promise<VActivitySummary[]> {
    const results = await this.db
      .select()
      .from(Activity)
      .where(
        and(
          eq(Activity.clubId, clubId),
          eq(Activity.activityDId, activityDId),
          or(
            eq(Activity.activityStatusEnumId, ActivityStatusEnum.Approved),
            eq(Activity.activityStatusEnumId, ActivityStatusEnum.Committee),
          ),
          isNull(Activity.deletedAt),
        ),
      );
    return results.map(result => VActivitySummary.fromDBResult(result));
  }

  async fetchParticipantIds(activityId: number): Promise<number[]> {
    const result = await this.db
      .select({
        id: ActivityParticipant.studentId,
      })
      .from(ActivityParticipant)
      .where(
        and(
          eq(ActivityParticipant.activityId, activityId),
          isNull(ActivityParticipant.deletedAt),
        ),
      );

    return result.map(participant => participant.id);
  }

  async fetchTx(
    tx: DrizzleTransaction,
    activityId: number,
  ): Promise<MActivity> {
    const activity = await tx
      .select()
      .from(Activity)
      .where(and(eq(Activity.id, activityId), isNull(Activity.deletedAt)));

    if (activity.length !== 1) {
      throw new NotFoundException("Activity not found");
    }

    const activityT = await tx
      .select()
      .from(ActivityT)
      .where(
        and(eq(ActivityT.activityId, activityId), isNull(ActivityT.deletedAt)),
      );

    const activityParticipant = await tx
      .select()
      .from(ActivityParticipant)
      .where(
        and(
          eq(ActivityParticipant.activityId, activityId),
          isNull(ActivityParticipant.deletedAt),
        ),
      );

    const activityEvidenceFile = await tx
      .select()
      .from(ActivityEvidenceFile)
      .where(
        and(
          eq(ActivityEvidenceFile.activityId, activityId),
          isNull(ActivityEvidenceFile.deletedAt),
        ),
      );

    const activityFeedback = await tx
      .select()
      .from(ActivityFeedback)
      .where(
        and(
          eq(ActivityFeedback.activityId, activityId),
          isNull(ActivityFeedback.deletedAt),
        ),
      );

    const activityClubChargedExecutive = await tx
      .select()
      .from(ActivityClubChargedExecutive)
      .where(
        and(
          eq(ActivityClubChargedExecutive.activityDId, activityId),
          isNull(ActivityClubChargedExecutive.deletedAt),
        ),
      );

    const result = {
      activity: activity[0],
      activityT,
      activityParticipant,
      activityEvidenceFile,
      activityFeedback,
      activityClubChargedExecutive,
    };

    return MActivity.fromDBResult(result);
  }

  async fetch(activityId: number): Promise<MActivity> {
    return this.withTransaction(tx => this.fetchTx(tx, activityId));
  }
}
