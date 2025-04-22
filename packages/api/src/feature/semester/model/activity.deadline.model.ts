import { IActivityDeadline } from "@clubs/domain/semester/deadline";
import { ISemester } from "@clubs/domain/semester/semester";

import { MEntity } from "@sparcs-clubs/api/common/base/entity.model";

export class MActivityDeadline extends MEntity implements IActivityDeadline {
  static modelName = "ActivityDeadline";

  semester: ISemester;
  deadlineEnum: IActivityDeadline["deadlineEnum"];
  startTerm: IActivityDeadline["startTerm"];
  endTerm: IActivityDeadline["endTerm"];

  constructor(data: IActivityDeadline) {
    super();
    Object.assign(this, data);
  }
}
