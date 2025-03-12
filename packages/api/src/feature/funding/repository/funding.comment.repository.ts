import { Injectable } from "@nestjs/common";
import { desc, eq } from "drizzle-orm";

import { IFundingCommentRequest } from "@sparcs-clubs/interface/api/funding/type/funding.comment.type";

import { BaseRepository } from "@sparcs-clubs/api/common/repository/base.repository";
import { DrizzleTransaction } from "@sparcs-clubs/api/drizzle/drizzle.provider";
import { FundingFeedback } from "@sparcs-clubs/api/drizzle/schema/funding.schema";
import {
  FundingCommentDbResult,
  MFundingComment,
} from "@sparcs-clubs/api/feature/funding/model/funding.comment.model";

@Injectable()
export default class FundingCommentRepository extends BaseRepository<
  MFundingComment,
  IFundingCommentRequest,
  FundingCommentDbResult,
  typeof FundingFeedback,
  number
> {
  constructor() {
    super(FundingFeedback, MFundingComment);
  }

  async findAllTx(
    tx: DrizzleTransaction,
    ids: number[],
  ): Promise<MFundingComment[]>;
  async findAllTx(
    tx: DrizzleTransaction,
    fundingId: number,
  ): Promise<MFundingComment[]>;
  async findAllTx(
    tx: DrizzleTransaction,
    arg1: number | number[],
  ): Promise<MFundingComment[]> {
    if (Array.isArray(arg1)) {
      return super.findAllTx(tx, arg1);
    }

    const result = await tx
      .select()
      .from(FundingFeedback)
      .where(eq(FundingFeedback.fundingId, arg1))
      .orderBy(desc(FundingFeedback.createdAt));

    return result.map(row => MFundingComment.from(row));
  }

  async findAll(fundingId: number): Promise<MFundingComment[]>;
  async findAll(ids: number[]): Promise<MFundingComment[]>;
  async findAll(arg1: number | number[]): Promise<MFundingComment[]> {
    if (Array.isArray(arg1)) {
      return super.findAll(arg1);
    }

    return this.withTransaction(async tx => this.findAllTx(tx, arg1));
  }

  async insertTx(
    tx: DrizzleTransaction,
    param: IFundingCommentRequest,
  ): Promise<MFundingComment> {
    const comment = {
      ...param,
      fundingId: param.funding.id,
      executiveId: param.executive.id,
      feedback: param.content,
    };
    return super.insertTx(tx, comment);
  }
}
