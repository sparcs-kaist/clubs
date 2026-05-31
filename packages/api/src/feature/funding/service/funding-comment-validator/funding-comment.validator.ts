import { match, P } from "ts-pattern";

import { FundingStatusEnum } from "@clubs/interface/common/enum/funding.enum";

const {
  Applied: FundingAppliedStatus,
  Approved: FundingApprovedStatus,
  Partial: FundingPartialStatus,
  Rejected: FundingRejectedStatus,
} = FundingStatusEnum;

export const FUNDING_APPROVED_AMOUNT_NEGATIVE_ERROR =
  "승인 금액은 0 이상이어야 합니다.";
export const FUNDING_APPLIED_STATUS_ERROR = "대기 상태로는 바꿀 수 없습니다.";
export const FUNDING_REJECTED_AMOUNT_ERROR =
  "반려 상태에서는 승인 금액을 0으로 설정해야 합니다.";
export const FUNDING_APPROVED_AMOUNT_EXCEEDED_ERROR =
  "승인 금액이 지출 금액보다 많을 수 없습니다.";
export const FUNDING_APPROVED_STATUS_AMOUNT_ERROR =
  "승인을 위해선 전체 금액의 전부가 승인되어야 합니다. 부분 승인을 이용해 주세요.";
export const FUNDING_PARTIAL_STATUS_AMOUNT_ERROR =
  "부분 승인 상태에서는 승인 금액이 0이거나 전체 금액과 같을 수 없습니다.";

export type FundingCommentValidationError =
  | typeof FUNDING_APPROVED_AMOUNT_NEGATIVE_ERROR
  | typeof FUNDING_APPLIED_STATUS_ERROR
  | typeof FUNDING_REJECTED_AMOUNT_ERROR
  | typeof FUNDING_APPROVED_AMOUNT_EXCEEDED_ERROR
  | typeof FUNDING_APPROVED_STATUS_AMOUNT_ERROR
  | typeof FUNDING_PARTIAL_STATUS_AMOUNT_ERROR;

type FundingCommentPreFetchValidationParam = {
  fundingStatusEnum: FundingStatusEnum;
  approvedAmount: number;
};

type FundingCommentAmountValidationParam =
  FundingCommentPreFetchValidationParam & {
    expenditureAmount: number;
  };

export const getFundingCommentPreFetchValidationError = (
  param: FundingCommentPreFetchValidationParam,
): FundingCommentValidationError | null =>
  match(param)
    .returnType<FundingCommentValidationError | null>()
    .with(
      P.when(({ approvedAmount }) => approvedAmount < 0),
      () => FUNDING_APPROVED_AMOUNT_NEGATIVE_ERROR,
    )
    .with(
      P.when(
        ({ fundingStatusEnum }) => fundingStatusEnum === FundingAppliedStatus,
      ),
      () => FUNDING_APPLIED_STATUS_ERROR,
    )
    .with(
      P.when(
        ({ fundingStatusEnum, approvedAmount }) =>
          fundingStatusEnum === FundingRejectedStatus && approvedAmount !== 0,
      ),
      () => FUNDING_REJECTED_AMOUNT_ERROR,
    )
    .otherwise(() => null);

export const getFundingCommentAmountValidationError = (
  param: FundingCommentAmountValidationParam,
): FundingCommentValidationError | null =>
  match(param)
    .returnType<FundingCommentValidationError | null>()
    .with(
      P.when(
        ({ approvedAmount, expenditureAmount }) =>
          approvedAmount > expenditureAmount,
      ),
      () => FUNDING_APPROVED_AMOUNT_EXCEEDED_ERROR,
    )
    .with(
      P.when(
        ({ fundingStatusEnum, approvedAmount, expenditureAmount }) =>
          fundingStatusEnum === FundingApprovedStatus &&
          expenditureAmount !== approvedAmount,
      ),
      () => FUNDING_APPROVED_STATUS_AMOUNT_ERROR,
    )
    .with(
      P.when(
        ({ fundingStatusEnum, approvedAmount, expenditureAmount }) =>
          fundingStatusEnum === FundingPartialStatus &&
          (approvedAmount === 0 || approvedAmount === expenditureAmount),
      ),
      () => FUNDING_PARTIAL_STATUS_AMOUNT_ERROR,
    )
    .otherwise(() => null);
