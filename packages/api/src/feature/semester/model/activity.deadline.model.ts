import { asc, desc, InferSelectModel, SQL } from "drizzle-orm";

import { IActivityDeadline } from "@sparcs-clubs/interface/api/semester/type/deadline.type";

import { ActivityDeadlineD } from "@sparcs-clubs/api/drizzle/schema/semester.schema";

import { OrderByTypeEnum } from "./semester.model";

type ActivityDeadlineDBResult = InferSelectModel<typeof ActivityDeadlineD>;

const orderByFieldMap = {
  startTerm: ActivityDeadlineD.startDate,
  endTerm: ActivityDeadlineD.endDate,
};

export type IActivityDeadlineOrderBy = Partial<{
  [key in keyof typeof orderByFieldMap]: OrderByTypeEnum;
}>;

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
      ...data,
      deadlineEnum: data.deadlineEnumId,
    });
  }

  static makeOrderBy(orderBy: IActivityDeadlineOrderBy): SQL[] {
    return Object.entries(orderBy)
      .filter(
        ([key, orderByType]) =>
          orderByType && orderByFieldMap[key as keyof typeof orderByFieldMap],
      )
      .map(([key, orderByType]) =>
        orderByType === OrderByTypeEnum.ASC
          ? asc(orderByFieldMap[key])
          : desc(orderByFieldMap[key]),
      );
  }
}
