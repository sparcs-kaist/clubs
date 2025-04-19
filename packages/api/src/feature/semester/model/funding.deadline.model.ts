import { InferInsertModel, InferSelectModel } from "drizzle-orm";

import { IFundingDeadline } from "@clubs/domain/semester/deadline";

import { MEntity } from "@sparcs-clubs/api/common/base/entity.model";
import { FundingDeadlineD } from "@sparcs-clubs/api/drizzle/schema/semester.schema";

export type FundingDeadlineFromDb = InferSelectModel<typeof FundingDeadlineD>;
export type FundingDeadlineToDb = InferInsertModel<typeof FundingDeadlineD>;

export class MFundingDeadline
  extends MEntity<IFundingDeadline>
  implements IFundingDeadline
{
  static modelName = "FundingDeadline";

  semester: IFundingDeadline["semester"];
  deadlineEnum: IFundingDeadline["deadlineEnum"];
  startTerm: IFundingDeadline["startTerm"];
  endTerm: IFundingDeadline["endTerm"];

  constructor(data: IFundingDeadline) {
    super(data);
  }
}
