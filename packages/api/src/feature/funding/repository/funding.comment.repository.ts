import { Injectable } from "@nestjs/common";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";

import { IFundingComment } from "@clubs/interface/api/funding/type/funding.comment.type";

import {
  BaseTableFieldMapKeys,
  TableWithID,
} from "@sparcs-clubs/api/common/base/base.repository";
import { BaseSingleTableRepository } from "@sparcs-clubs/api/common/base/base.single.repository";
import { FundingFeedback } from "@sparcs-clubs/api/drizzle/schema/funding.schema";
import { MFundingComment } from "@sparcs-clubs/api/feature/funding/model/funding.comment.model";

type FundingCommentQuery = {
  fundingId: number;
};

type FundingCommentTable = typeof FundingFeedback;
type FundingCommentDbSelect = InferSelectModel<FundingCommentTable>;
type FundingCommentDbInsert = InferInsertModel<FundingCommentTable>;
type FundingCommentDbUpdate = Partial<FundingCommentDbInsert>;

type FundingCommentFieldMapKeys = BaseTableFieldMapKeys<FundingCommentQuery>;

@Injectable()
export default class FundingCommentRepository extends BaseSingleTableRepository<
  MFundingComment,
  IFundingComment,
  FundingCommentTable,
  FundingCommentDbSelect,
  FundingCommentDbInsert,
  FundingCommentDbUpdate,
  FundingCommentQuery
> {
  constructor() {
    super(FundingFeedback, MFundingComment);
  }

  protected dbToModelMapping(result: FundingCommentDbSelect): MFundingComment {
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

  protected modelToDBMapping(model: MFundingComment): FundingCommentDbUpdate {
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

  protected fieldMap(
    field: FundingCommentFieldMapKeys,
  ): TableWithID | null | undefined {
    const fieldMappings: Record<
      FundingCommentFieldMapKeys,
      TableWithID | null
    > = {
      id: FundingFeedback,
      fundingId: FundingFeedback,
    };

    if (!(field in fieldMappings)) {
      return undefined;
    }

    return fieldMappings[field];
  }
}
