import { InferInsertModel, InferSelectModel } from "drizzle-orm";

import { IFundingComment } from "@clubs/interface/api/funding/type/funding.comment.type";
import { FundingStatusEnum } from "@clubs/interface/common/enum/funding.enum";

import { MEntity } from "@sparcs-clubs/api/common/base/entity.model";
import { FundingFeedback } from "@sparcs-clubs/api/drizzle/schema/funding.schema";

import { MFunding } from "./funding.model";
import { VFundingSummary } from "./funding.summary.model";

export type FromDb = InferSelectModel<typeof FundingFeedback>;
export type ToDb = InferInsertModel<typeof FundingFeedback>;

export class MFundingComment
  extends MEntity<IFundingComment, number>
  implements IFundingComment
{
  static modelName = "fundingComment";

  funding: { id: number };

  executive: {
    id: number;
  };

  content: string;

  fundingStatusEnum: FundingStatusEnum;

  approvedAmount: number;

  createdAt: Date;

  constructor(data: IFundingComment) {
    super(data);
  }

  isFinalComment(funding: VFundingSummary | MFunding): boolean {
    return (
      funding.approvedAmount === this.approvedAmount &&
      funding.fundingStatusEnum === this.fundingStatusEnum &&
      funding.id === this.funding.id
    );
  }
}
