import { Injectable } from "@nestjs/common";

import { BaseRepository } from "@sparcs-clubs/api/common/repository/base.repository";
import { FundingFeedback } from "@sparcs-clubs/api/drizzle/schema/funding.schema";
import {
  FundingCommentDbResult,
  FundingCommentQuery,
  MFundingComment,
} from "@sparcs-clubs/api/feature/funding/model/funding.comment.model";

@Injectable()
export default class FundingCommentRepository extends BaseRepository<
  MFundingComment,
  FundingCommentDbResult,
  typeof FundingFeedback,
  FundingCommentQuery
> {
  constructor() {
    super(FundingFeedback, MFundingComment);
  }
}
