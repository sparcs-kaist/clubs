import { IFundingComment } from "@sparcs-clubs/interface/api/funding/type/funding.type";
import { FundingStatusEnum } from "@sparcs-clubs/interface/common/enum/funding.enum";
import { InferSelectModel } from "drizzle-orm";

import { FundingFeedback } from "@sparcs-clubs/api/drizzle/schema/funding.schema";

import { MFunding } from "./funding.model";
import { VFundingSummary } from "./funding.summary.model";

export type FundingCommentDBResult = InferSelectModel<typeof FundingFeedback>;

export class MFundingComment implements IFundingComment {
  id: number;

  funding: { id: number };

  chargedExecutive: {
    id: number;
  };

  content: string;

  fundingStatusEnum: FundingStatusEnum;

  approvedAmount: number;

  createdAt: Date;

  constructor(data: IFundingComment) {
    Object.assign(this, data);
  }

  equals(other: MFundingComment): boolean {
    // 모든 키의 값이 동일한지 확인
    return Object.keys(this).every(key => this[key] === other[key]);
  }

  isFinalComment(funding: VFundingSummary | MFunding): boolean {
    return Object.keys(this).every(key => this[key] === funding[key]);
  }

  static fromDBResult(result: FundingCommentDBResult) {
    return new MFundingComment({
      id: result.id,
      funding: { id: result.fundingId },
      chargedExecutive: {
        id: result.chargedExecutiveId,
      },
      fundingStatusEnum: result.fundingStatusEnum,
      approvedAmount: result.approvedAmount,
      content: result.feedback,
      createdAt: result.createdAt,
    });
  }
}
