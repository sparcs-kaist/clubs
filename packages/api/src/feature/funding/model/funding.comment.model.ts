import {
  ColumnBaseConfig,
  ColumnDataType,
  InferSelectModel,
} from "drizzle-orm";
import { MySqlColumn } from "drizzle-orm/mysql-core";

import { IFundingComment } from "@sparcs-clubs/interface/api/funding/type/funding.comment.type";
import { FundingStatusEnum } from "@sparcs-clubs/interface/common/enum/funding.enum";
import {
  Exclude,
  filterExcludedFields,
  OperationType,
} from "@sparcs-clubs/interface/common/utils/field-operations";

import { MEntity } from "@sparcs-clubs/api/common/model/entity.model";
import { FundingFeedback } from "@sparcs-clubs/api/drizzle/schema/funding.schema";

import { MFunding } from "./funding.model";
import { VFundingSummary } from "./funding.summary.model";

export type FundingCommentDbResult = InferSelectModel<typeof FundingFeedback>;

export type FundingCommentQuery = {
  fundingId: number;
};

export class MFundingComment
  extends MEntity<number>
  implements IFundingComment
{
  static modelName = "fundingComment";

  funding: { id: number };

  executive: {
    id: number;
  };

  content: string;

  fundingStatusEnum: FundingStatusEnum = FundingStatusEnum.Applied;

  approvedAmount: number;

  @Exclude(OperationType.CREATE)
  createdAt: Date;

  @Exclude(OperationType.CREATE)
  deletedAt: Date | null;

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

  static from(result: FundingCommentDbResult): MFundingComment {
    return new MFundingComment({
      id: result.id,
      funding: { id: result.fundingId },
      executive: {
        id: result.executiveId,
      },
      fundingStatusEnum: result.fundingStatusEnum,
      approvedAmount: result.approvedAmount,
      content: result.feedback,
      createdAt: result.createdAt,
    });
  }

  to(operation: OperationType): FundingCommentDbResult {
    const filtered = filterExcludedFields(this, operation);

    return {
      id: filtered.id ?? undefined,
      fundingId: filtered.funding?.id,
      executiveId: filtered.executive?.id,
      feedback: filtered.content,
      fundingStatusEnum: filtered.fundingStatusEnum,
      approvedAmount: filtered.approvedAmount,
      createdAt: filtered.createdAt,
      deletedAt: filtered.deletedAt,
    };
  }

  static fieldMap(
    field: keyof FundingCommentQuery,
  ): MySqlColumn<ColumnBaseConfig<ColumnDataType, string>> {
    const fieldMappings: Record<
      keyof FundingCommentQuery,
      MySqlColumn<ColumnBaseConfig<ColumnDataType, string>>
    > = {
      fundingId: FundingFeedback.fundingId,
    };

    if (!(field in fieldMappings)) {
      throw new Error(`Invalid field: ${String(field)}`);
    }

    return fieldMappings[field];
  }
}
