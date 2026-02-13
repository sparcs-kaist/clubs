import { IActivity } from "@clubs/interface/api/activity/type/activity.type";

type ActivityDbResult = {
  activity: {
    id: number;
    clubId: number;
    originalName: string;
    name: string;
    activityTypeEnumId: number;
    location: string;
    purpose: string;
    detail: string;
    evidence: string;
    activityDId: number;
    activityStatusEnumId: number;
    chargedExecutiveId: number | null;
    professorApprovedAt: Date | null;
    commentedAt: Date | null;
    commentedExecutiveId: number | null;
    editedAt: Date;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  };
  activityT: Array<{
    id: number;
    activityId: number;
    startTerm: Date;
    endTerm: Date;
    createdAt: Date;
    deletedAt: Date | null;
  }>;
  activityParticipant: Array<{
    id: number;
    activityId: number;
    studentId: number;
    createdAt: Date;
    deletedAt: Date | null;
  }>;
  activityEvidenceFile: Array<{
    id: number;
    activityId: number;
    fileId: string;
    createdAt: Date;
    deletedAt: Date | null;
  }>;
  activityFeedback: Array<{
    id: number;
    activityId: number;
    executiveId: number;
    comment: string;
    activityStatusEnum: number;
    createdAt: Date;
    deletedAt: Date | null;
  }>;
  activityClubChargedExecutive: Array<{
    id: number;
    activityDId: number;
    clubId: number;
    executiveId: number | null;
    createdAt: Date;
    deletedAt: Date | null;
  }>;
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
