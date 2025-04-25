import { IFundingDeadline } from "@clubs/domain/semester/deadline";

import { MEntity } from "@sparcs-clubs/api/common/base/entity.model";

export interface IFundingDeadlineCreate {
  semester: IFundingDeadline["semester"];
  deadlineEnum: IFundingDeadline["deadlineEnum"];
  startTerm: IFundingDeadline["startTerm"];
  endTerm: IFundingDeadline["endTerm"];
}

export class MFundingDeadline extends MEntity implements IFundingDeadline {
  static modelName = "FundingDeadline";

  semester: IFundingDeadline["semester"];
  deadlineEnum: IFundingDeadline["deadlineEnum"];
  startTerm: IFundingDeadline["startTerm"];
  endTerm: IFundingDeadline["endTerm"];

  constructor(data: IFundingDeadline) {
    super();
    Object.assign(this, data);
  }
}
