import { InferSelectModel } from "drizzle-orm";

import { IFundingDeadline } from "@sparcs-clubs/interface/api/semester/type/deadline.type";

import { FundingDeadlineD } from "@sparcs-clubs/api/drizzle/schema/semester.schema";

type FundingDeadlineDBResult = InferSelectModel<typeof FundingDeadlineD>;

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
}
