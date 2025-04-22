import { IActivityDuration } from "@clubs/domain/semester/activity-duration";

import { MEntity } from "@sparcs-clubs/api/common/base/entity.model";

export class MActivityDuration extends MEntity implements IActivityDuration {
  static modelName = "ActivityDuration";

  year: IActivityDuration["year"];
  name: IActivityDuration["name"];
  startTerm: IActivityDuration["startTerm"];
  endTerm: IActivityDuration["endTerm"];
  semester: IActivityDuration["semester"];
  activityDurationTypeEnum: IActivityDuration["activityDurationTypeEnum"];

  constructor(data: IActivityDuration) {
    super();
    Object.assign(this, data);
  }
}
