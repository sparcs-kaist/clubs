import { asc, desc, InferSelectModel, SQL } from "drizzle-orm";

import { IActivityDuration } from "@sparcs-clubs/interface/api/semester/type/activity.duration.type";

import { ActivityD } from "@sparcs-clubs/api/drizzle/schema/semester.schema";

import { OrderByTypeEnum } from "./semester.model";

type ActivityDurationDBResult = InferSelectModel<typeof ActivityD>;

const orderByFieldMap = {
  startTerm: ActivityD.startTerm,
  endTerm: ActivityD.endTerm,
  year: ActivityD.year,
};

export type IActivityDurationOrderBy = Partial<{
  [key in keyof typeof orderByFieldMap]: OrderByTypeEnum;
}>;

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
    return new MActivityDuration({ ...data });
  }

  static makeOrderBy(orderBy: IActivityDurationOrderBy): SQL[] {
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
