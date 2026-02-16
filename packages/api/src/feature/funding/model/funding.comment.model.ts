import { IFundingComment } from "@clubs/interface/api/funding/type/funding.comment.type";

import { MEntity } from "@sparcs-clubs/api/common/base/entity.model";

import { MFunding } from "./funding.model";
import { VFundingSummary } from "./funding.summary.model";

export type FromDb = {
  id: number;
  fundingId: number;
  executiveId: number;
  content: string;
  fundingStatusEnum: number;
  approvedAmount: number;
  createdAt: Date;
  deletedAt: Date | null;
};

export type ToDb = {
  fundingId: number;
  executiveId: number;
  content: string;
  fundingStatusEnum: number;
  approvedAmount: number;
};

export interface IFundingCommentCreate {
  funding: IFundingComment["funding"];
  executive: IFundingComment["executive"];
  content: IFundingComment["content"];
  fundingStatusEnum: IFundingComment["fundingStatusEnum"];
  approvedAmount: IFundingComment["approvedAmount"];
}

export class MFundingComment extends MEntity implements IFundingComment {
  static modelName = "fundingComment";

  funding: IFundingComment["funding"];

  executive: IFundingComment["executive"];

  content: IFundingComment["content"];

  fundingStatusEnum: IFundingComment["fundingStatusEnum"];

  approvedAmount: IFundingComment["approvedAmount"];

  createdAt: IFundingComment["createdAt"];

  constructor(data: IFundingComment) {
    super();
    Object.assign(this, data);
  }

  isFinalComment(funding: VFundingSummary | MFunding): boolean {
    return (
      funding.approvedAmount === this.approvedAmount &&
      funding.fundingStatusEnum === this.fundingStatusEnum &&
      funding.id === this.funding.id
    );
  }
}
