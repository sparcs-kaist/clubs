import { Injectable } from "@nestjs/common";

import { BaseRepository } from "@sparcs-clubs/api/common/base/base.repository";
import { FundingFeedback } from "@sparcs-clubs/api/drizzle/schema/funding.schema";
import {
  FromDb,
  FundingCommentQuery,
  MFundingComment,
} from "@sparcs-clubs/api/feature/funding/model/funding.comment.model";

@Injectable()
export default class FundingCommentRepository extends BaseRepository<
  MFundingComment,
  FromDb,
  typeof FundingFeedback,
  FundingCommentQuery
> {
  constructor() {
    super(FundingFeedback, MFundingComment);
  }
}
