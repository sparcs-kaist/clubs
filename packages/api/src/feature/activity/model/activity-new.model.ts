import { InferInsertModel, InferSelectModel } from "drizzle-orm";

import {
  ActivityStatusEnum,
  ActivityTypeEnum,
  IActivity,
} from "@clubs/domain/activity/activity";

import {
  Exclude,
  filterExcludedFields,
  OperationType,
} from "@clubs/interface/common/utils/field-operations";

import {
  MEntity,
  MySqlColumnType,
} from "@sparcs-clubs/api/common/model/entity.model";
import {
  makeObjectPropsFromDBTimezone,
  makeObjectPropsToDBTimezone,
} from "@sparcs-clubs/api/common/util/util";
import {
  Activity,
  ActivityEvidenceFile,
  ActivityFeedback,
  ActivityParticipant,
  ActivityT,
} from "@sparcs-clubs/api/drizzle/schema/activity.schema";

export type ActivityFromDb = {
  activity: InferSelectModel<typeof Activity>;
  activityParticipants: InferSelectModel<typeof ActivityParticipant>[];
  activityEvidenceFiles: InferSelectModel<typeof ActivityEvidenceFile>[];
  activityTs: InferSelectModel<typeof ActivityT>[];
  activityComment: InferSelectModel<typeof ActivityFeedback>[];
};
export type ActivityToDbCreate = {
  activity: InferInsertModel<typeof Activity>;
  activityParticipants: InferInsertModel<typeof ActivityParticipant>[];
  activityEvidenceFiles: InferInsertModel<typeof ActivityEvidenceFile>[];
  activityTs: InferInsertModel<typeof ActivityT>[];
};

export type ActivityToDbUpdate = {
  activity: Partial<InferSelectModel<typeof Activity>>;
  activityParticipants: Partial<InferSelectModel<typeof ActivityParticipant>>[];
  activityEvidenceFiles: Partial<
    InferSelectModel<typeof ActivityEvidenceFile>
  >[];
  activityTs: Partial<InferSelectModel<typeof ActivityT>>[];
};

export type ActivityQuery = {
  clubId?: number;
  activityDurationId?: number;
  activityTypeEnum?: ActivityTypeEnum;
  activityStatusEnum?: ActivityStatusEnum;
};

export type ActivityOrderBy = ["startTerm", "endTerm", "year"][number];

/**
 * @description Activity 모델
 * @description 활동 보고서 모델입니다.
 * @description Activity 테이블과 ActivityParticipant, ActivityEvidence, ActivityT 테이블을 포함합니다.
 */

export class MActivity extends MEntity implements IActivity {
  static modelName = "Activity";

  name: IActivity["name"];

  activityDuration: IActivity["activityDuration"];

  activityTypeEnum: IActivity["activityTypeEnum"];

  activityStatusEnum: IActivity["activityStatusEnum"];

  location: IActivity["location"];

  purpose: IActivity["purpose"];

  detail: IActivity["detail"];

  evidence: IActivity["evidence"];

  club: IActivity["club"];

  durations: IActivity["durations"];

  evidenceFiles: IActivity["evidenceFiles"];

  participants: IActivity["participants"];

  @Exclude(OperationType.CREATE)
  professorApprovedAt: IActivity["professorApprovedAt"];

  @Exclude(OperationType.CREATE)
  chargedExecutive: IActivity["chargedExecutive"];

  @Exclude(OperationType.CREATE)
  commentedExecutive: IActivity["commentedExecutive"];

  @Exclude(OperationType.CREATE)
  commentedAt: IActivity["commentedAt"];

  @Exclude(OperationType.CREATE)
  editedAt: IActivity["editedAt"];

  constructor(data: IActivity) {
    super();
    Object.assign(this, data);
  }

  toCreate(): ActivityToDbCreate {
    const filtered = filterExcludedFields(this, OperationType.CREATE);
    const adjusted = makeObjectPropsToDBTimezone(filtered);
    return {
      activity: {
        clubId: adjusted.club.id,
        name: adjusted.name,
        originalName: adjusted.name,
        activityTypeEnumId: adjusted.activityTypeEnum,
        location: adjusted.location,
        purpose: adjusted.purpose,
        detail: adjusted.detail,
        evidence: adjusted.evidence,
        activityDId: adjusted.activityDuration.id,
        activityStatusEnumId: adjusted.activityStatusEnum,
      },
      activityParticipants: adjusted.participants.map(participant => ({
        studentId: participant.id,
        activityId: adjusted.id,
      })),
      activityEvidenceFiles: adjusted.evidenceFiles.map(evidenceFile => ({
        fileId: evidenceFile.id,
        activityId: adjusted.id,
      })),
      activityTs: adjusted.durations.map(t => ({
        startTerm: t.startTerm,
        endTerm: t.endTerm,
        activityId: adjusted.id,
      })),
    };
  }

  toUpdate(): ActivityToDbUpdate {
    const filtered = filterExcludedFields(this, OperationType.PUT);
    const adjusted = makeObjectPropsToDBTimezone(filtered);
    return {
      activity: {
        clubId: adjusted.club.id,
        name: adjusted.name,
        activityTypeEnumId: adjusted.activityTypeEnum,
        location: adjusted.location,
        purpose: adjusted.purpose,
        detail: adjusted.detail,
        evidence: adjusted.evidence,
        activityDId: adjusted.activityDuration.id,
        activityStatusEnumId: adjusted.activityStatusEnum,
        chargedExecutiveId: adjusted.chargedExecutive?.id, // 없으면 null이나 undefined 들어가긴 하는데 drizzle 작동에는 문제 X
        professorApprovedAt: adjusted.professorApprovedAt,
        commentedAt: adjusted.commentedAt,
        commentedExecutiveId: adjusted.commentedExecutive?.id,
        editedAt: adjusted.editedAt,
      },
      activityParticipants: adjusted.participants.map(participant => ({
        studentId: participant.id,
        activityId: adjusted.id,
      })),
      activityEvidenceFiles: adjusted.evidenceFiles.map(evidenceFile => ({
        fileId: evidenceFile.id,
        activityId: adjusted.id,
      })),
      activityTs: adjusted.durations.map(t => ({
        startTerm: t.startTerm,
        endTerm: t.endTerm,
        activityId: adjusted.id,
      })),
    };
  }

  static from(result: ActivityFromDb): MActivity {
    const adjusted = makeObjectPropsFromDBTimezone(result);
    return new MActivity({
      id: adjusted.activity.id,
      name: adjusted.activity.name,
      activityDuration: { id: adjusted.activity.activityDId },
      activityTypeEnum: adjusted.activity.activityTypeEnumId,
      activityStatusEnum: adjusted.activity.activityStatusEnumId,
      location: adjusted.activity.location,
      purpose: adjusted.activity.purpose,
      detail: adjusted.activity.detail,
      evidence: adjusted.activity.evidence,
      professorApprovedAt: adjusted.activity.professorApprovedAt,
      commentedAt: adjusted.activity.commentedAt,
      editedAt: adjusted.activity.editedAt,
      club: { id: adjusted.activity.clubId },
      durations: adjusted.activityTs.map(t => ({
        startTerm: t.startTerm,
        endTerm: t.endTerm,
      })),

      chargedExecutive: adjusted.activity.chargedExecutiveId
        ? { id: adjusted.activity.chargedExecutiveId }
        : null,
      commentedExecutive: adjusted.activity.commentedExecutiveId
        ? { id: adjusted.activity.commentedExecutiveId }
        : null,
      evidenceFiles: adjusted.activityEvidenceFiles.map(e => ({
        id: e.fileId,
      })),
      participants: adjusted.activityParticipants.map(p => ({
        id: p.studentId,
      })),
    });
  }

  static fieldMap(field: keyof ActivityQuery): MySqlColumnType {
    const fieldMappings: Record<keyof ActivityQuery, MySqlColumnType> = {
      clubId: Activity.clubId,
      activityDurationId: Activity.activityDId,
      activityTypeEnum: Activity.activityTypeEnumId,
      activityStatusEnum: Activity.activityStatusEnumId,
    };

    if (!(field in fieldMappings)) {
      throw new Error(`Invalid field: ${String(field)}`);
    }

    return fieldMappings[field];
  }

  /**
   * @description 교수 승인을 위한 patch용 함수
   */
  static changeStatusForProfessor(): (original: MActivity) => MActivity {
    return (original: MActivity) =>
      new MActivity({
        ...original,
        professorApprovedAt: new Date(),
      });
  }

  /**
   * @description 담당 집행부원 변경을 위한 patch용 함수
   */
  static changeStatusForChargedExecutive(
    statusEnum: ActivityStatusEnum,
    chargedExecutive: { id: number },
  ): (original: MActivity) => MActivity {
    return (original: MActivity) =>
      new MActivity({
        ...original,
        activityStatusEnum: statusEnum,
        commentedAt: new Date(),
        chargedExecutive,
      });
  }

  /**
   * @description 집행부 검토를 위한 patch용 함수
   */
  static changeStatusForExecutiveComment(
    statusEnum: ActivityStatusEnum,
    commentedExecutive: { id: number },
    commentedAt: Date = new Date(),
  ): (original: MActivity) => MActivity {
    return (original: MActivity) =>
      new MActivity({
        ...original,
        activityStatusEnum: statusEnum,
        commentedAt,
        commentedExecutive,
      });
  }
}
