import { ActivityStatusEnum, IActivity } from "@clubs/domain/activity/activity";

import { MEntity } from "@sparcs-clubs/api/common/base/entity.model";

export interface IActivityCreate {
  name: IActivity["name"];
  location: IActivity["location"];
  club: IActivity["club"];
  activityTypeEnum: IActivity["activityTypeEnum"];
  activityStatusEnum: IActivity["activityStatusEnum"];
  activityDuration: IActivity["activityDuration"];
  participants: IActivity["participants"];
  durations: IActivity["durations"];
  purpose: IActivity["purpose"];
  detail: IActivity["detail"];
  evidence: IActivity["evidence"];
  evidenceFiles: IActivity["evidenceFiles"];
}

export class MActivity extends MEntity implements IActivity {
  static modelName = "activity";

  name: IActivity["name"];
  location: IActivity["location"];
  club: IActivity["club"];
  activityTypeEnum: IActivity["activityTypeEnum"];
  activityStatusEnum: IActivity["activityStatusEnum"];
  activityDuration: IActivity["activityDuration"];
  participants: IActivity["participants"];
  chargedExecutive: IActivity["chargedExecutive"];
  durations: IActivity["durations"];
  purpose: IActivity["purpose"];
  detail: IActivity["detail"];
  evidence: IActivity["evidence"];
  evidenceFiles: IActivity["evidenceFiles"];
  commentedExecutive: IActivity["commentedExecutive"];
  commentedAt: IActivity["commentedAt"];
  editedAt: IActivity["editedAt"];
  professorApprovedAt: IActivity["professorApprovedAt"];

  constructor(data: IActivity) {
    super();
    Object.assign(this, data);
  }

  static updateStatus(status: ActivityStatusEnum) {
    return (model: MActivity) =>
      new MActivity({
        ...model,
        activityStatusEnum: status,
      });
  }

  static updateChargedExecutive(executiveId: number) {
    return (model: MActivity) =>
      new MActivity({
        ...model,
        chargedExecutive: { id: executiveId },
      });
  }
}
