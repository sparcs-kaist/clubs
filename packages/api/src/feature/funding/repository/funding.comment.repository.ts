import { Injectable } from "@nestjs/common";

import { BaseTableFieldMapKeys } from "@sparcs-clubs/api/common/base/base.repository";
import { BaseSingleTableRepository } from "@sparcs-clubs/api/common/base/base.single.repository";
import {
  IFundingCommentCreate,
  MFundingComment,
} from "@sparcs-clubs/api/feature/funding/model/funding.comment.model";

export type FundingCommentQuery = {
  fundingId: number;
};

type FundingCommentFieldMapKeys = BaseTableFieldMapKeys<FundingCommentQuery>;

@Injectable()
export class FundingCommentRepository extends BaseSingleTableRepository<
  MFundingComment,
  IFundingCommentCreate,
  FundingCommentQuery
> {
  constructor() {
    super("fundingFeedback", MFundingComment);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected dbToModelMapping(result: any): MFundingComment {
    return new MFundingComment({
      id: result.id,
      funding: { id: result.fundingId },
      executive: {
        id: result.executiveId,
      },
      fundingStatusEnum: result.fundingStatusEnum,
      approvedAmount: result.approvedAmount,
      content: result.content,
      createdAt: result.createdAt,
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected modelToDBMapping(model: MFundingComment): any {
    return {
      id: model.id,
      fundingId: model.funding.id,
      executiveId: model.executive.id,
      content: model.content,
      fundingStatusEnum: model.fundingStatusEnum,
      approvedAmount: model.approvedAmount,
      createdAt: model.createdAt,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected createToDBMapping(model: IFundingCommentCreate): any {
    return {
      fundingId: model.funding.id,
      executiveId: model.executive.id,
      content: model.content,
      fundingStatusEnum: model.fundingStatusEnum,
      approvedAmount: model.approvedAmount,
    };
  }

  protected fieldMap(
    field: FundingCommentFieldMapKeys,
  ): string | null | undefined {
    const fieldMappings: Record<FundingCommentFieldMapKeys, string | null> = {
      id: "id",
      fundingId: "fundingId",
    };

    if (!(field in fieldMappings)) {
      return undefined;
    }

    return fieldMappings[field as keyof typeof fieldMappings];
  }
}
