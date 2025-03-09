import { asc, desc, InferSelectModel, SQL } from "drizzle-orm";

import { IFundingDeadline } from "@sparcs-clubs/interface/api/semester/type/deadline.type";

import { FundingDeadlineD } from "@sparcs-clubs/api/drizzle/schema/semester.schema";

import { OrderByTypeEnum } from "./semester.model";

type FundingDeadlineDBResult = InferSelectModel<typeof FundingDeadlineD>;

const orderByFieldMap = {
  startTerm: FundingDeadlineD.startDate,
  endTerm: FundingDeadlineD.endDate,
};

export type IFundingDeadlineOrderBy = Partial<{
  [key in keyof typeof orderByFieldMap]: OrderByTypeEnum;
}>;

export class MFundingDeadline implements IFundingDeadline {
  id: IFundingDeadline["id"];
  deadlineEnum: IFundingDeadline["deadlineEnum"];
  startDate: IFundingDeadline["startDate"];
  endDate: IFundingDeadline["endDate"];

  constructor(data: IFundingDeadline) {
    Object.assign(this, data);
  }

  static from(data: FundingDeadlineDBResult): MFundingDeadline {
    return new MFundingDeadline(data);
  }

  static makeOrderBy(orderBy: IFundingDeadlineOrderBy): SQL[] {
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
