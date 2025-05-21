import { InferSelectModel } from "drizzle-orm";

import { IFundingSummary } from "@clubs/interface/api/funding/type/funding.type";

import { Funding } from "@sparcs-clubs/api/drizzle/schema/funding.schema";

import { MFunding } from "./funding.model";

export type FundingSummaryDBResult = Pick<
  InferSelectModel<typeof Funding>,
  | "id"
  | "name"
  | "fundingStatusEnum"
  | "expenditureAmount"
  | "purposeActivityId"
  | "approvedAmount"
  | "clubId"
  | "chargedExecutiveId"
>;

export class VFundingSummary implements IFundingSummary {
  id: IFundingSummary["id"];

  name: IFundingSummary["name"];

  fundingStatusEnum: IFundingSummary["fundingStatusEnum"];

  expenditureAmount: IFundingSummary["expenditureAmount"];

  purposeActivity: IFundingSummary["purposeActivity"];

  approvedAmount?: IFundingSummary["approvedAmount"];

  club: IFundingSummary["club"];

  chargedExecutive: IFundingSummary["chargedExecutive"];

  // 첫 번째 생성자: IFundingSummary로부터 초기화
  constructor(fundingSummary: IFundingSummary);

  // 두 번째 생성자: MFunding로부터 초기화
  constructor(funding: MFunding);

  constructor(param: IFundingSummary | MFunding) {
    if (param instanceof MFunding) {
      this.id = param.id;
      this.name = param.name;
      this.fundingStatusEnum = param.fundingStatusEnum;
      this.expenditureAmount = param.expenditureAmount;
      this.purposeActivity = param.purposeActivity;
      this.approvedAmount = param.approvedAmount;
    } else {
      Object.assign(this, param);
    }
  }

  static fromDBResult(result: FundingSummaryDBResult) {
    return new VFundingSummary({
      id: result.id,
      name: result.name,
      fundingStatusEnum: result.fundingStatusEnum,
      expenditureAmount: result.expenditureAmount,
      purposeActivity: result.purposeActivityId
        ? { id: result.purposeActivityId }
        : undefined,
      approvedAmount: result.approvedAmount,
      club: result.clubId ? { id: result.clubId } : undefined,
      chargedExecutive: result.chargedExecutiveId
        ? { id: result.chargedExecutiveId }
        : undefined,
    });
  }
}
