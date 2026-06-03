import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { IActivitySummary } from "@clubs/interface/api/activity/type/activity.type";
import {
  ActivityStatusEnum,
  ActivityTypeEnum,
} from "@clubs/interface/common/enum/activity.enum";

import { CLOCK, Clock } from "@sparcs-clubs/api/common/clock/clock";
import logger from "@sparcs-clubs/api/common/util/logger";
import { PrismaService } from "@sparcs-clubs/api/prisma/prisma.service";

import { MActivity } from "../model/activity.model";
import { VActivitySummary } from "../model/activity.summary.model";

type PrismaTransactionClient = Prisma.TransactionClient;

@Injectable()
export default class ActivityRepository {
  @Inject(CLOCK) private readonly clock: Clock;

  constructor(private readonly prisma: PrismaService) {}

  async withTransaction<Result>(
    callback: (tx: PrismaTransactionClient) => Promise<Result>,
  ): Promise<Result> {
    return this.prisma.$transaction(callback);
  }

  selectActivityByIds(activityIds: number[]) {
    return this.prisma.activity.findMany({
      where: { id: { in: activityIds } },
    });
  }

  updateActivityProfessorApprovedAt(param: {
    activityIds: number[];
    professorId: number;
  }) {
    const today = this.clock.now();

    return this.prisma.activity.updateMany({
      where: { id: { in: param.activityIds } },
      data: { professorApprovedAt: today },
    });
  }

  // 활동을 DB에서 soft delete 합니다.
  // 작성에 성공하면 True, 실패하면 False를 리턴합니다.
  async deleteActivity(contents: { activityId: number }): Promise<boolean> {
    try {
      await this.prisma.$transaction(async tx => {
        const deletedAt = this.clock.now();

        const activityResult = await tx.activity.updateMany({
          where: {
            id: contents.activityId,
            deletedAt: null,
          },
          data: {
            deletedAt,
            editedAt: deletedAt,
          },
        });

        if (activityResult.count !== 1) {
          logger.debug(
            "[deleteActivity] activity deletion failed. Rollback occurs",
          );
          throw new Error("activity deletion failed");
        }

        const participantResult = await tx.activityParticipant.updateMany({
          where: {
            activityId: contents.activityId,
            deletedAt: null,
          },
          data: { deletedAt },
        });
        if (participantResult.count < 1) {
          logger.debug(
            "[deleteActivity] student deletion failed. Rollback occurs",
          );
          throw new Error("student deletion failed");
        }

        const durationResult = await tx.activityT.updateMany({
          where: {
            activityId: contents.activityId,
            deletedAt: null,
          },
          data: { deletedAt },
        });
        if (durationResult.count < 1) {
          logger.debug(
            "[deleteActivity] duration deletion failed. Rollback occurs",
          );
          throw new Error("duration deletion failed");
        }

        const fileResult = await tx.activityEvidenceFile.updateMany({
          where: {
            activityId: contents.activityId,
            deletedAt: null,
          },
          data: { deletedAt },
        });
        if (fileResult.count < 1) {
          logger.debug(
            "[deleteActivity] file deletion failed. Rollback occurs",
          );
          throw new Error("file deletion failed");
        }

        // feedback은 아직 없을수도 있어서 롤백이 없어요
        await tx.activityFeedback.updateMany({
          where: {
            activityId: contents.activityId,
            deletedAt: null,
          },
          data: { deletedAt },
        });
      });
      return true;
    } catch {
      return false;
    }
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
    try {
      await this.prisma.$transaction(async tx => {
        const activity = await tx.activity.create({
          data: {
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
          },
        });

        logger.debug(
          `[insertActivity] New activity inserted with id ${activity.id}`,
        );

        await Promise.all(
          contents.participantIds.map(async studentId => {
            await tx.activityParticipant.create({
              data: {
                activityId: activity.id,
                studentId,
              },
            });
          }),
        );

        await Promise.all(
          contents.duration.map(async ({ startTerm, endTerm }) => {
            await tx.activityT.create({
              data: {
                activityId: activity.id,
                startTerm,
                endTerm,
              },
            });
          }),
        );

        await Promise.all(
          contents.evidenceFileIds.map(async fileId => {
            await tx.activityEvidenceFile.create({
              data: {
                activityId: activity.id,
                fileId,
              },
            });
          }),
        );

        await tx.professorSignStatus.create({
          // TODO: 교수님 사인도 activityD로 맞추기
          data: { clubId: contents.clubId, semesterId: contents.activityDId },
        });
      });
      return true;
    } catch {
      return false;
    }
  }

  async selectActivityByActivityId(activityId: number) {
    return this.prisma.activity.findMany({
      where: { id: activityId, deletedAt: null },
    });
  }

  async selectActivityByActivityDId(activityDId: number) {
    return this.prisma.activity.findMany({
      where: { activityDId, deletedAt: null },
    });
  }

  /**
   * @param clubId 동아리 ID
   * @description 가동아리 활보 작성은 하나의 기간만 존재하기에
   * clubId기준으로 한번에 가져오기 위한 쿼리입니다.
   * @returns 해당 동아리가 적은 삭제되지 않은 모든 활동을 가져옵니다.
   */
  async selectActivityByClubId(param: { clubId: number }) {
    return this.prisma.activity.findMany({
      where: { clubId: param.clubId, deletedAt: null },
    });
  }

  async selectActivityByClubIdAndActivityDId(
    clubId: number,
    activityDId: number,
  ) {
    return this.prisma.activity.findMany({
      where: { clubId, activityDId, deletedAt: null },
    });
  }

  /**
   * @param param
   * @returns activityId를 기준으로 반려 피드백 리스트를 리턴합니다.
   */
  async selectActivityFeedbackByActivityId(param: { activityId: number }) {
    return this.prisma.activityFeedback.findMany({
      where: { activityId: param.activityId, deletedAt: null },
    });
  }

  async selectFileByActivityId(activityId: number) {
    return this.prisma.activityEvidenceFile.findMany({
      where: { activityId, deletedAt: null },
    });
  }

  async selectDurationByActivityId(activityId: number) {
    return this.prisma.activityT.findMany({
      where: { activityId, deletedAt: null },
      orderBy: [{ startTerm: "asc" }, { endTerm: "asc" }],
    });
  }

  async selectParticipantByActivityId(activityId: number) {
    const result = await this.prisma.activityParticipant.findMany({
      where: { activityId, deletedAt: null },
      include: {
        student: {
          select: { id: true, number: true, name: true },
        },
      },
    });

    return result.map(r => ({
      studentId: r.studentId,
      studentNumber: r.student.number,
      name: r.student.name,
    }));
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
    try {
      await this.prisma.$transaction(async tx => {
        const deletedAt = this.clock.now();

        const activityResult = await tx.activity.updateMany({
          where: { id: param.activityId },
          data: {
            name: param.name,
            activityTypeEnumId: Number(param.activityTypeEnumId),
            location: param.location,
            purpose: param.purpose,
            detail: param.detail,
            evidence: param.evidence,
            activityDId: param.activityDId,
            activityStatusEnumId: Number(param.activityStatusEnumId),
            editedAt: deletedAt,
          },
        });
        if (activityResult.count !== 1) {
          logger.debug("[updateActivity] rollback occurs");
          throw new Error("activity update failed");
        }

        // 참가자 전체 삭제 및 재생성
        const participantDeletionResult =
          await tx.activityParticipant.updateMany({
            where: {
              activityId: param.activityId,
              deletedAt: null,
            },
            data: { deletedAt },
          });
        if (participantDeletionResult.count < 1) {
          logger.debug(
            "[deleteActivity] student deletion failed. Rollback occurs",
          );
          throw new Error("student deletion failed");
        }
        await Promise.all(
          param.participantIds.map(async studentId => {
            await tx.activityParticipant.create({
              data: {
                activityId: param.activityId,
                studentId,
              },
            });
          }),
        );

        // 기간 전체 삭제 및 재생성
        const durationDeletionResult = await tx.activityT.updateMany({
          where: {
            activityId: param.activityId,
            deletedAt: null,
          },
          data: { deletedAt },
        });
        if (durationDeletionResult.count < 1) {
          logger.debug(
            "[deleteActivity] duration deletion failed. Rollback occurs",
          );
          throw new Error("duration deletion failed");
        }
        await Promise.all(
          param.duration.map(async ({ startTerm, endTerm }) => {
            await tx.activityT.create({
              data: {
                activityId: param.activityId,
                startTerm,
                endTerm,
              },
            });
          }),
        );

        // 근거 자료 전체 삭제 및 재생성
        const fileDeletionResult = await tx.activityEvidenceFile.updateMany({
          where: {
            activityId: param.activityId,
            deletedAt: null,
          },
          data: { deletedAt },
        });
        if (fileDeletionResult.count < 1) {
          logger.debug(
            "[deleteActivity] file deletion failed. Rollback occurs",
          );
          throw new Error("file deletion failed");
        }
        await Promise.all(
          param.evidenceFileIds.map(async fileId => {
            await tx.activityEvidenceFile.create({
              data: {
                activityId: param.activityId,
                fileId,
              },
            });
          }),
        );
      });
      return true;
    } catch {
      return false;
    }
  }

  async selectActivityNameById(id: number) {
    const result = await this.prisma.activity.findUnique({
      where: { id },
      select: { name: true, id: true },
    });
    return result;
  }

  async fetchSummary(id: number): Promise<IActivitySummary> {
    const result = await this.prisma.activity.findUnique({
      where: { id },
    });

    if (!result) {
      throw new NotFoundException("Activity not found");
    }

    return VActivitySummary.fromDBResult(result);
  }

  async fetchSummaries(activityIds: number[]): Promise<IActivitySummary[]> {
    if (activityIds.length === 0) return [];
    const results = await this.prisma.activity.findMany({
      where: { id: { in: activityIds } },
    });
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
    return this.prisma.$transaction(async tx => {
      const activity = await tx.activity.findFirst({
        where: { id: param.activityId, deletedAt: null },
      });
      if (!activity) throw new HttpException("not found", HttpStatus.NOT_FOUND);
      if (activity.activityStatusEnumId === param.activityStatusEnumId)
        return false;
      const updateResult = await tx.activity.updateMany({
        where: { id: param.activityId, deletedAt: null },
        data: {
          activityStatusEnumId: param.activityStatusEnumId,
          commentedAt: this.clock.now(),
        },
      });
      if (updateResult.count !== 1)
        throw new HttpException(
          "failed to update activityStatusEnumId",
          HttpStatus.BAD_REQUEST,
        );
      return true;
    });
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
    const updateResult = await this.prisma.activity.updateMany({
      where: { id: param.activityId, deletedAt: null },
      data: { chargedExecutiveId: param.executiveId },
    });
    return updateResult.count > 0;
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
    const clubIds = param.clubsList;
    if (clubIds.length === 0) return [];

    const results: Array<{
      clubId: number;
      clubTypeEnum: number;
      divisionName: string;
      clubNameKr: string;
      clubNameEn: string;
      advisor: string | null;
      chargedExecutiveId: number | null;
    }> = await this.prisma.$queryRaw`
      SELECT
        c.id AS clubId,
        ct.club_status_enum_id AS clubTypeEnum,
        d.name AS divisionName,
        c.name_kr AS clubNameKr,
        c.name_en AS clubNameEn,
        p.name AS advisor,
        acce.executive_id AS chargedExecutiveId
      FROM club c
      INNER JOIN club_t ct
        ON ct.club_id = c.id
        AND ct.semester_id = ${param.semesterId}
        AND ct.deleted_at IS NULL
      INNER JOIN division d
        ON d.id = c.division_id
        AND d.deleted_at IS NULL
      LEFT JOIN professor p
        ON p.id = ct.professor_id
        AND p.deleted_at IS NULL
      LEFT JOIN activity_club_charged_executive acce
        ON acce.club_id = c.id
        AND acce.activity_d_id = ${param.activityDId}
        AND acce.deleted_at IS NULL
      WHERE c.id IN (${Prisma.join(clubIds)})
        AND c.deleted_at IS NULL
    `;

    return results;
  }

  async fetchCommentedSummaries(
    executiveId: number,
  ): Promise<VActivitySummary[]> {
    const results: Array<{
      id: number;
      activityStatusEnumId: number;
      activityTypeEnumId: number;
      clubId: number;
      name: string;
      commentedAt: Date | null;
      editedAt: Date;
      updatedAt: Date;
      chargedExecutiveId: number | null;
      commentedExecutiveId: number | null;
    }> = await this.prisma.$queryRaw`
      SELECT
        a.id,
        a.activity_status_enum_id AS activityStatusEnumId,
        a.activity_type_enum_id AS activityTypeEnumId,
        a.club_id AS clubId,
        a.name,
        a.commented_at AS commentedAt,
        a.edited_at AS editedAt,
        a.updated_at AS updatedAt,
        a.charged_executive_id AS chargedExecutiveId,
        lf.executive_id AS commentedExecutiveId
      FROM activity a
      LEFT JOIN (
        SELECT af.activity_id, af.executive_id
        FROM activity_feedback af
        WHERE af.executive_id = ${executiveId}
          AND af.deleted_at IS NULL
        ORDER BY af.created_at DESC
      ) lf ON lf.activity_id = a.id
      WHERE a.deleted_at IS NULL
        AND (
          a.charged_executive_id = ${executiveId}
          OR EXISTS (
            SELECT 1 FROM activity_feedback af2
            WHERE af2.activity_id = a.id
              AND af2.executive_id = ${executiveId}
              AND af2.deleted_at IS NULL
          )
        )
    `;

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
    const results = await this.prisma.activity.findMany({
      where: {
        clubId,
        activityDId,
        activityStatusEnumId: {
          in: [ActivityStatusEnum.Approved, ActivityStatusEnum.Committee],
        },
        deletedAt: null,
      },
    });
    return results.map(result => VActivitySummary.fromDBResult(result));
  }

  async fetchParticipantIds(activityId: number): Promise<number[]> {
    const result = await this.prisma.activityParticipant.findMany({
      where: { activityId, deletedAt: null },
      select: { studentId: true },
    });

    return result.map(participant => participant.studentId);
  }

  async fetchTx(
    tx: PrismaTransactionClient,
    activityId: number,
  ): Promise<MActivity> {
    const activity = await tx.activity.findMany({
      where: { id: activityId, deletedAt: null },
    });

    if (activity.length !== 1) {
      throw new NotFoundException("Activity not found");
    }

    const activityT = await tx.activityT.findMany({
      where: { activityId, deletedAt: null },
    });

    const activityParticipant = await tx.activityParticipant.findMany({
      where: { activityId, deletedAt: null },
    });

    const activityEvidenceFile = await tx.activityEvidenceFile.findMany({
      where: { activityId, deletedAt: null },
    });

    const activityFeedback = await tx.activityFeedback.findMany({
      where: { activityId, deletedAt: null },
    });

    const activityClubChargedExecutive =
      await tx.activityClubChargedExecutive.findMany({
        where: { activityDId: activityId, deletedAt: null },
      });

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
