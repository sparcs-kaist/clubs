import { InferSelectModel } from "drizzle-orm";

import { IActivityDeadline } from "@sparcs-clubs/interface/api/semester/type/deadline.type";

import { ActivityDeadlineD } from "@sparcs-clubs/api/drizzle/schema/semester.schema";

type ActivityDeadlineDBResult = InferSelectModel<typeof ActivityDeadlineD>;

export class MActivityDeadline implements IActivityDeadline {
  id: IActivityDeadline["id"];
  deadlineEnum: IActivityDeadline["deadlineEnum"];
  startDate: IActivityDeadline["startDate"];
  endDate: IActivityDeadline["endDate"];

  constructor(data: IActivityDeadline) {
    Object.assign(this, data);
  }

  static from(data: ActivityDeadlineDBResult): MActivityDeadline {
    return new MActivityDeadline({
      id: data.id,
      startDate: data.startDate,
      endDate: data.endDate,
      deadlineEnum: data.deadlineEnumId,
    });
  }
}
