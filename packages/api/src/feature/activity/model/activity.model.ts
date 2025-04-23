import { InferSelectModel } from "drizzle-orm";

import { IActivity } from "@clubs/interface/api/activity/type/activity.type";

import {
  Activity,
  ActivityClubChargedExecutive,
  ActivityEvidenceFile,
  ActivityFeedback,
  ActivityParticipant,
  ActivityT,
} from "@sparcs-clubs/api/drizzle/schema/activity.schema";

type ActivityDbResult = {
  activity: InferSelectModel<typeof Activity>;
  activityT: InferSelectModel<typeof ActivityT>[];
  activityParticipant: InferSelectModel<typeof ActivityParticipant>[];
  activityEvidenceFile: InferSelectModel<typeof ActivityEvidenceFile>[];
  activityFeedback: InferSelectModel<typeof ActivityFeedback>[];
  activityClubChargedExecutive: InferSelectModel<
    typeof ActivityClubChargedExecutive
  >[];
};

export class MActivity implements IActivity {
  id: IActivity["id"];
  club: IActivity["club"];
  activityDuration: IActivity["activityDuration"];
  name: IActivity["name"];
  activityTypeEnum: IActivity["activityTypeEnum"];
  activityStatusEnum: IActivity["activityStatusEnum"];
  durations: IActivity["durations"];
  location: IActivity["location"];
  purpose: IActivity["purpose"];
  detail: IActivity["detail"];
  evidence: IActivity["evidence"];
  evidenceFiles: IActivity["evidenceFiles"];
  participants: IActivity["participants"];
  chargedExecutive: IActivity["chargedExecutive"];
  commentedExecutive: IActivity["commentedExecutive"];
  commentedAt: IActivity["commentedAt"];
  editedAt: IActivity["editedAt"];
  updatedAt: IActivity["updatedAt"];

  constructor(data: IActivity) {
    Object.assign(this, data);
  }

  static fromDBResult(dbResult: ActivityDbResult): MActivity {
    return new MActivity({
      id: dbResult.activity.id,
      club: { id: dbResult.activity.clubId },
      name: dbResult.activity.name,
      activityTypeEnum: dbResult.activity.activityTypeEnumId,
      activityStatusEnum: dbResult.activity.activityStatusEnumId,
      activityDuration: {
        id: dbResult.activity.activityDId,
      },
      durations: dbResult.activityT.map(t => ({
        id: t.id,
        startTerm: t.startTerm,
        endTerm: t.endTerm,
      })),
      location: dbResult.activity.location,
      purpose: dbResult.activity.purpose,
      detail: dbResult.activity.detail,
      evidence: dbResult.activity.evidence,
      evidenceFiles: dbResult.activityEvidenceFile.map(e => ({
        id: e.fileId,
      })),
      participants: dbResult.activityParticipant.map(p => ({
        id: p.studentId,
      })),
      chargedExecutive:
        dbResult.activityClubChargedExecutive.length > 0
          ? {
              id: dbResult.activityClubChargedExecutive.reduce((acc, curr) => {
                if (acc.createdAt < curr.createdAt) {
                  return curr;
                }
                return acc;
              }).executiveId,
            }
          : undefined,
      commentedExecutive:
        dbResult.activityFeedback.length > 0
          ? {
              id: dbResult.activityFeedback.reduce((acc, curr) => {
                if (acc.createdAt < curr.createdAt) {
                  return curr;
                }
                return acc;
              }).executiveId,
            }
          : undefined,
      commentedAt: dbResult.activity.commentedAt,
      editedAt: dbResult.activity.editedAt,
      updatedAt: dbResult.activity.updatedAt,
    });
  }
}
