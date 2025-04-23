import { InferInsertModel, InferSelectModel } from "drizzle-orm";

import { IFundingComment } from "@clubs/interface/api/funding/type/funding.comment.type";

import { MEntity } from "@sparcs-clubs/api/common/base/entity.model";
import { ExcludeInCreate } from "@sparcs-clubs/api/common/util/decorators/model-property-decorator";
import { FundingFeedback } from "@sparcs-clubs/api/drizzle/schema/funding.schema";

import { MFunding } from "./funding.model";
import { VFundingSummary } from "./funding.summary.model";

export type FromDb = InferSelectModel<typeof FundingFeedback>;
export type ToDb = InferInsertModel<typeof FundingFeedback>;

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

  @ExcludeInCreate()
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
