import { InferSelectModel } from "drizzle-orm";

import { IActivityDuration } from "@sparcs-clubs/interface/api/semester/type/activity.duration.type";

import { ActivityD } from "@sparcs-clubs/api/drizzle/schema/semester.schema";

type ActivityDurationDBResult = InferSelectModel<typeof ActivityD>;

export class MActivityDuration implements IActivityDuration {
  id: IActivityDuration["id"];
  year: IActivityDuration["year"];
  name: IActivityDuration["name"];
  startTerm: IActivityDuration["startTerm"];
  endTerm: IActivityDuration["endTerm"];

  constructor(data: IActivityDuration) {
    Object.assign(this, data);
  }

  static from(data: ActivityDurationDBResult): MActivityDuration {
    return new MActivityDuration(data);
  }
}
