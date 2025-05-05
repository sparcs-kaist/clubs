import { IActivityComment } from "@clubs/domain/activity/activity-comment";

import { MEntity } from "@sparcs-clubs/api/common/base/entity.model";

export interface IActivityCommentCreate {
  content: IActivityComment["content"];
  activityStatusEnum: IActivityComment["activityStatusEnum"];
  activity: IActivityComment["activity"];
  executive: IActivityComment["executive"];
}

export class MActivityComment extends MEntity implements IActivityComment {
  static modelName = "ActivityComment";

  content: IActivityComment["content"];

  activityStatusEnum: IActivityComment["activityStatusEnum"];

  activity: IActivityComment["activity"];

  executive: IActivityComment["executive"];

  createdAt: IActivityComment["createdAt"];

  constructor(data: IActivityComment) {
    super();
    Object.assign(this, data);
  }
}
