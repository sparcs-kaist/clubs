import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { TransactionHost } from "@nestjs-cls/transactional";
import { Prisma } from "@prisma/client";

import { ProfessorApprovalStatus } from "@clubs/domain/activity/activity";

import {
  ActivityStatusEnum,
  ActivityTypeEnum,
} from "@clubs/interface/common/enum/activity.enum";

import {
  BaseMultiTableRepository,
  MultiInsertModel,
  MultiSelectModel,
  MultiUpdateModel,
  PrismaMultiTableConfig,
} from "@sparcs-clubs/api/common/base/base.multi.repository";
import { BaseTableFieldMapKeys } from "@sparcs-clubs/api/common/base/base.repository";
import { toReviewSnapshot } from "@sparcs-clubs/api/common/review/review-snapshot";
import { PrismaTransactionalAdapter } from "@sparcs-clubs/api/common/transaction/transaction.type";
import { forEachAsyncSequentially } from "@sparcs-clubs/api/common/util/util";
import {
  IActivityCreate,
  MActivity,
} from "@sparcs-clubs/api/feature/activity/model/activity.model.new";

export type ActivityQuery = {
  clubId: number;
  activityTypeEnumId: ActivityTypeEnum;
  activityStatusEnumId: ActivityStatusEnum;
  activityDId: number;
};

type ActivityOrderByKeys = "id";
type ActivityQuerySupport = {};

type ActivityDbSelect = MultiSelectModel;
type ActivityDbUpdate = MultiUpdateModel;
type ActivityDbInsert = MultiInsertModel<unknown, "activityId">;

type ActivityFieldMapKeys = BaseTableFieldMapKeys<
  ActivityQuery,
  ActivityOrderByKeys,
  ActivityQuerySupport
>;

const activityTableConfig: PrismaMultiTableConfig = {
  main: "activity",
  oneToOne: {},
  oneToMany: {
    activityT: {
      prismaModelName: "activityT",
      relationField: "activityTs",
      foreignKey: "activityId",
    },
    activityEvidenceFile: {
      prismaModelName: "activityEvidenceFile",
      relationField: "activityEvidenceFiles",
      foreignKey: "activityId",
    },
    activityParticipant: {
      prismaModelName: "activityParticipant",
      relationField: "activityParticipants",
      foreignKey: "activityId",
    },
  },
};

const internalMemoSelect = {
  content: true,
  updatedAt: true,
  updatedBy: true,
} as const;

@Injectable()
export class ActivityNewRepository extends BaseMultiTableRepository<
  MActivity,
  IActivityCreate,
  "activityId",
  ActivityQuery,
  ActivityOrderByKeys,
  ActivityQuerySupport
> {
  constructor(
    private readonly txHost: TransactionHost<PrismaTransactionalAdapter>,
  ) {
    super(activityTableConfig, MActivity, "activityId");
  }

  async getInternalMemo(id: number) {
    const item = await this.txHost.tx.activity.findUnique({
      where: { id, deletedAt: null },
      select: { internalMemo: { select: internalMemoSelect } },
    });
    if (!item) throw new NotFoundException(`Activity: ${id} not found`);
    return item.internalMemo;
  }

  async putInternalMemo(
    id: number,
    memo: {
      content: string;
      updatedAt: Date;
      updatedBy: string;
      updatedByExecutiveId: number;
    },
  ) {
    await this.getInternalMemo(id);
    return this.txHost.tx.activityInternalMemo.upsert({
      where: { activityId: id },
      create: { activityId: id, ...memo },
      update: { ...memo },
      select: internalMemoSelect,
    });
  }

  async deleteInternalMemo(id: number) {
    await this.getInternalMemo(id);
    await this.txHost.tx.activityInternalMemo.deleteMany({
      where: { activityId: id },
    });
  }

  async fetchForReportUpdate(id: number): Promise<MActivity> {
    const { tx } = this.txHost;
    // Write before the first read so concurrent edits capture adjacent versions.
    await tx.activity.updateMany({
      where: { id, deletedAt: null },
      data: { id },
    });
    return this.fetch(id, tx);
  }

  async recordChangeHistory(
    before: MActivity,
    editorStudentId: number,
    createdAt: Date,
  ): Promise<void> {
    const { tx } = this.txHost;
    const after = await this.fetch(before.id, tx);
    await tx.activityChangeHistory.create({
      data: {
        activityId: before.id,
        editorStudentId,
        before: this.snapshot(before),
        after: this.snapshot(after),
        createdAt,
      },
    });
  }

  private snapshot(activity: MActivity) {
    return toReviewSnapshot({
      name: activity.name,
      activityTypeEnumId: activity.activityTypeEnum,
      durations: activity.durations,
      location: activity.location,
      purpose: activity.purpose,
      detail: activity.detail,
      evidence: activity.evidence,
      evidenceFiles: activity.evidenceFiles,
      participants: activity.participants,
    });
  }

  async findChangeHistory(activityId: number) {
    await this.fetch(activityId);
    return this.txHost.tx.activityChangeHistory.findMany({
      where: { activityId },
      orderBy: { id: "desc" },
      select: { id: true, createdAt: true, before: true, after: true },
    });
  }

  selectActivityByIds(activityIds: number[]) {
    return this.txHost.tx.activity.findMany({
      where: { id: { in: activityIds }, deletedAt: null },
      select: { id: true, clubId: true, activityDId: true },
    });
  }

  async recordProfessorActivityApprovals(param: {
    activityIds: number[];
    clubId: number;
    activityDId: number;
    professorId: number;
    approvalStatus: Exclude<
      ProfessorApprovalStatus,
      typeof ProfessorApprovalStatus.Pending
    >;
    approvedAt: Date;
  }): Promise<void> {
    const { clubId, activityDId, professorId, approvalStatus, approvedAt } =
      param;
    const logEntries: Prisma.ActivityProfessorApprovalLogCreateManyInput[] = [];

    // The caller orders IDs so overlapping batches acquire row locks in the same order.
    await forEachAsyncSequentially(param.activityIds, async id => {
      const scope = { id, clubId, activityDId };
      const result = await this.txHost.tx.activity.updateMany({
        where: {
          ...scope,
          deletedAt: null,
          professorApprovalStatus: ProfessorApprovalStatus.Pending,
        },
        data: {
          professorApprovalStatus: approvalStatus,
          professorApprovedAt: approvedAt,
        },
      });
      if (result.count === 1) {
        logEntries.push({
          activityId: id,
          professorId,
          approvalStatus,
          approvedAt,
        });
      } else {
        const activity = await this.txHost.tx.activity.findFirst({
          where: { ...scope, deletedAt: null },
          select: { professorApprovalStatus: true },
        });
        if (!activity) throw new NotFoundException("No such activity");
        if (
          activity.professorApprovalStatus === ProfessorApprovalStatus.Pending
        ) {
          throw new ConflictException(
            "Activity changed while it was being approved",
          );
        }
      }
    });

    if (logEntries.length > 0) {
      await this.txHost.tx.activityProfessorApprovalLog.createMany({
        data: logEntries,
      });
    }
  }

  async approveExecutiveActivity(param: {
    activityId: number;
    commentedAt: Date;
    commentedExecutiveId: number;
  }): Promise<boolean> {
    const result = await this.txHost.tx.activity.updateMany({
      where: {
        id: param.activityId,
        deletedAt: null,
      },
      data: {
        activityStatusEnumId: ActivityStatusEnum.Approved,
        commentedAt: param.commentedAt,
        commentedExecutiveId: param.commentedExecutiveId,
        updatedAt: this.clock.now(),
      },
    });

    return result.count > 0;
  }

  async sendBackExecutiveActivity(param: {
    activityId: number;
    commentedAt: Date;
    commentedExecutiveId: number;
  }): Promise<boolean> {
    const result = await this.txHost.tx.activity.updateMany({
      where: {
        id: param.activityId,
        deletedAt: null,
      },
      data: {
        activityStatusEnumId: ActivityStatusEnum.Rejected,
        commentedAt: param.commentedAt,
        commentedExecutiveId: param.commentedExecutiveId,
        updatedAt: this.clock.now(),
      },
    });

    return result.count > 0;
  }

  async updateActivityReport(activity: MActivity): Promise<boolean> {
    const data = this.modelToDB(activity);
    const { id: _, ...mainData } = data.main;
    const deletedAt = this.clock.now();
    const activityTerms: Prisma.ActivityTUncheckedCreateInput[] =
      data.oneToMany.activityT.map(row => ({
        activityId: activity.id,
        startTerm: row.startTerm,
        endTerm: row.endTerm,
      }));
    const evidenceFiles: Prisma.ActivityEvidenceFileUncheckedCreateInput[] =
      data.oneToMany.activityEvidenceFile.map(row => ({
        activityId: activity.id,
        fileId: row.fileId,
      }));
    const participants: Prisma.ActivityParticipantUncheckedCreateInput[] =
      data.oneToMany.activityParticipant.map(row => ({
        activityId: activity.id,
        studentId: row.studentId,
      }));

    const activityResult = await this.txHost.tx.activity.updateMany({
      where: {
        id: activity.id,
        deletedAt: null,
      },
      data: {
        ...mainData,
        professorApprovedAt: activity.professorApprovedAt,
        professorApprovalStatus: activity.professorApprovalStatus,
      },
    });

    if (activityResult.count !== 1) return false;

    await Promise.all([
      this.txHost.tx.activityT.updateMany({
        where: {
          activityId: activity.id,
          deletedAt: null,
        },
        data: { deletedAt },
      }),
      this.txHost.tx.activityEvidenceFile.updateMany({
        where: {
          activityId: activity.id,
          deletedAt: null,
        },
        data: { deletedAt },
      }),
      this.txHost.tx.activityParticipant.updateMany({
        where: {
          activityId: activity.id,
          deletedAt: null,
        },
        data: { deletedAt },
      }),
    ]);

    await Promise.all([
      ...activityTerms.map(row =>
        this.txHost.tx.activityT.create({
          data: row,
        }),
      ),
      ...evidenceFiles.map(row =>
        this.txHost.tx.activityEvidenceFile.create({
          data: row,
        }),
      ),
      ...participants.map(row =>
        this.txHost.tx.activityParticipant.create({
          data: row,
        }),
      ),
    ]);

    return true;
  }

  protected dbToModelMapping(result: ActivityDbSelect): MActivity {
    return new MActivity({
      id: result.main.id,
      club: { id: result.main.clubId },
      name: result.main.name,
      activityTypeEnum: result.main.activityTypeEnumId,
      activityStatusEnum: result.main.activityStatusEnumId,
      activityDuration: { id: result.main.activityDId },
      location: result.main.location,
      purpose: result.main.purpose,
      detail: result.main.detail,
      evidence: result.main.evidence,
      evidenceFiles: result.oneToMany.activityEvidenceFile.map(
        evidenceFile => ({
          id: evidenceFile.fileId,
        }),
      ),
      participants: result.oneToMany.activityParticipant.map(participant => ({
        id: participant.studentId,
      })),
      chargedExecutive: { id: result.main.chargedExecutiveId },
      commentedExecutive: result.main.commentedExecutiveId
        ? { id: result.main.commentedExecutiveId }
        : undefined,
      commentedAt: result.main.commentedAt,
      editedAt: result.main.editedAt,
      professorApprovedAt: result.main.professorApprovedAt,
      professorApprovalStatus: result.main.professorApprovalStatus,
      durations: result.oneToMany.activityT as {
        startTerm: Date;
        endTerm: Date;
      }[],
    });
  }

  protected modelToDBMapping(model: MActivity): ActivityDbUpdate {
    return {
      main: {
        id: model.id,
        name: model.name,
        clubId: model.club.id,
        activityTypeEnumId: model.activityTypeEnum,
        activityStatusEnumId: model.activityStatusEnum,
        activityDId: model.activityDuration.id,
        location: model.location,
        purpose: model.purpose,
        detail: model.detail,
        evidence: model.evidence,
        chargedExecutiveId: model.chargedExecutive?.id,
        commentedExecutiveId: model.commentedExecutive?.id ?? null,
        commentedAt: model.commentedAt,
        editedAt: model.editedAt,
        updatedAt: this.clock.now(),
      },
      oneToOne: {},
      oneToMany: {
        activityT: model.durations.map(duration => ({
          activityId: model.id,
          startTerm: duration.startTerm,
          endTerm: duration.endTerm,
        })),
        activityEvidenceFile: model.evidenceFiles.map(evidenceFile => ({
          activityId: model.id,
          fileId: evidenceFile.id,
        })),
        activityParticipant: model.participants.map(participant => ({
          activityId: model.id,
          studentId: participant.id,
        })),
      },
    };
  }

  protected createToDBMapping(model: IActivityCreate): ActivityDbInsert {
    return {
      main: {
        clubId: model.club.id,
        originalName: model.name,
        name: model.name,
        activityTypeEnumId: model.activityTypeEnum,
        activityStatusEnumId: model.activityStatusEnum,
        activityDId: model.activityDuration.id,
        location: model.location,
        purpose: model.purpose,
        detail: model.detail,
        evidence: model.evidence,
      },
      oneToOne: {},
      oneToMany: {
        activityT: model.durations.map(duration => ({
          startTerm: duration.startTerm,
          endTerm: duration.endTerm,
        })),
        activityEvidenceFile: model.evidenceFiles.map(evidenceFile => ({
          fileId: evidenceFile.id,
        })),
        activityParticipant: model.participants.map(participant => ({
          studentId: participant.id,
        })),
      },
    };
  }

  protected fieldMap(field: ActivityFieldMapKeys): string | null | undefined {
    const fieldMappings: Record<ActivityFieldMapKeys, string | null> = {
      id: "id",
      clubId: "clubId",
      activityTypeEnumId: "activityTypeEnumId",
      activityStatusEnumId: "activityStatusEnumId",
      activityDId: "activityDId",
    };

    if (!(field in fieldMappings)) {
      return undefined;
    }

    return fieldMappings[field as keyof typeof fieldMappings];
  }
}
