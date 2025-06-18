import { Injectable } from "@nestjs/common";

import {
  ActivityStatusEnum,
  ActivityTypeEnum,
} from "@clubs/interface/common/enum/activity.enum";

import {
  BaseMultiTableRepository,
  MultiInsertModel,
  MultiSelectModel,
  MultiUpdateModel,
} from "@sparcs-clubs/api/common/base/base.multi.repository";
import {
  BaseTableFieldMapKeys,
  TableWithID,
} from "@sparcs-clubs/api/common/base/base.repository";
import {
  Activity,
  ActivityEvidenceFile,
  ActivityParticipant,
  ActivityT,
} from "@sparcs-clubs/api/drizzle/schema/activity.schema";
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

type ActivityTable = {
  main: typeof Activity;
  oneToOne: {};
  oneToMany: {
    activityT: typeof ActivityT;
    activityEvidenceFile: typeof ActivityEvidenceFile;
    activityParticipant: typeof ActivityParticipant;
  };
};
type ActivityDbSelect = MultiSelectModel<ActivityTable>;
type ActivityDbUpdate = MultiUpdateModel<ActivityTable>;
type ActivityDbInsert = MultiInsertModel<ActivityTable, "activityId">;

type ActivityFieldMapKeys = BaseTableFieldMapKeys<
  ActivityQuery,
  ActivityOrderByKeys,
  ActivityQuerySupport
>;

@Injectable()
export class ActivityNewRepository extends BaseMultiTableRepository<
  MActivity,
  IActivityCreate,
  "activityId",
  ActivityTable,
  ActivityQuery,
  ActivityOrderByKeys,
  ActivityQuerySupport
> {
  constructor() {
    super(
      {
        main: Activity,
        oneToOne: {},
        oneToMany: {
          activityT: ActivityT,
          activityEvidenceFile: ActivityEvidenceFile,
          activityParticipant: ActivityParticipant,
        },
      },
      MActivity,
      "activityId",
    );
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
      commentedExecutive: undefined,
      commentedAt: result.main.commentedAt,
      editedAt: result.main.editedAt,
      professorApprovedAt: result.main.professorApprovedAt,
      durations: result.oneToMany.activityT,
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
        commentedAt: model.commentedAt,
        editedAt: model.editedAt,
        updatedAt: new Date(),
        professorApprovedAt: model.professorApprovedAt,
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

  protected fieldMap(
    field: ActivityFieldMapKeys,
  ): TableWithID | null | undefined {
    const fieldMappings: Record<ActivityFieldMapKeys, TableWithID | null> = {
      id: Activity,
      clubId: Activity,
      activityTypeEnumId: Activity,
      activityStatusEnumId: Activity,
      activityDId: Activity,
    };

    if (!(field in fieldMappings)) {
      return undefined;
    }

    return fieldMappings[field];
  }
}
