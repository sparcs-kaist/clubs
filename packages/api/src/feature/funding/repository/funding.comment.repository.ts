import { Injectable } from "@nestjs/common";

import { IFundingCommentRequest } from "@sparcs-clubs/interface/api/funding/type/funding.comment.type";

import { BaseRepository } from "@sparcs-clubs/api/common/repository/base.repository";
import { DrizzleTransaction } from "@sparcs-clubs/api/drizzle/drizzle.provider";
import { FundingFeedback } from "@sparcs-clubs/api/drizzle/schema/funding.schema";
import {
  FundingCommentDbResult,
  FundingCommentQuery,
  MFundingComment,
} from "@sparcs-clubs/api/feature/funding/model/funding.comment.model";

@Injectable()
export default class FundingCommentRepository extends BaseRepository<
  MFundingComment,
  IFundingCommentRequest,
  IFundingCommentRequest,
  FundingCommentDbResult,
  typeof FundingFeedback,
  FundingCommentQuery
> {
  constructor() {
    super(FundingFeedback, MFundingComment);
  }

  async createTx(
    tx: DrizzleTransaction,
    param: IFundingCommentRequest,
  ): Promise<MFundingComment> {
    const comment = {
      ...param,
      fundingId: param.funding.id,
      executiveId: param.executive.id,
      feedback: param.content,
    };
    return super.createTx(tx, comment);
  }
}
