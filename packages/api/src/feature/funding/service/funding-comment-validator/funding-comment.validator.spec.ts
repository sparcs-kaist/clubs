import { FundingStatusEnum } from "@clubs/interface/common/enum/funding.enum";

import {
  FUNDING_APPLIED_STATUS_ERROR,
  FUNDING_APPROVED_AMOUNT_EXCEEDED_ERROR,
  FUNDING_APPROVED_AMOUNT_NEGATIVE_ERROR,
  FUNDING_APPROVED_STATUS_AMOUNT_ERROR,
  FUNDING_PARTIAL_STATUS_AMOUNT_ERROR,
  FUNDING_REJECTED_AMOUNT_ERROR,
  getFundingCommentAmountValidationError,
  getFundingCommentPreFetchValidationError,
} from "./funding-comment.validator";

describe("funding-comment.validator", () => {
  it("rejects negative approved amounts before fetching funding", () => {
    expect(
      getFundingCommentPreFetchValidationError({
        fundingStatusEnum: FundingStatusEnum.Approved,
        approvedAmount: -1,
      }),
    ).toBe(FUNDING_APPROVED_AMOUNT_NEGATIVE_ERROR);
  });

  it("rejects applied status before fetching funding", () => {
    expect(
      getFundingCommentPreFetchValidationError({
        fundingStatusEnum: FundingStatusEnum.Applied,
        approvedAmount: 0,
      }),
    ).toBe(FUNDING_APPLIED_STATUS_ERROR);
  });

  it("rejects rejected status with a nonzero approved amount", () => {
    expect(
      getFundingCommentPreFetchValidationError({
        fundingStatusEnum: FundingStatusEnum.Rejected,
        approvedAmount: 1,
      }),
    ).toBe(FUNDING_REJECTED_AMOUNT_ERROR);
  });

  it("allows rejected status with a zero approved amount", () => {
    expect(
      getFundingCommentPreFetchValidationError({
        fundingStatusEnum: FundingStatusEnum.Rejected,
        approvedAmount: 0,
      }),
    ).toBeNull();
  });

  it("allows non-rejected status through the rejected amount rule", () => {
    expect(
      getFundingCommentPreFetchValidationError({
        fundingStatusEnum: FundingStatusEnum.Approved,
        approvedAmount: 1,
      }),
    ).toBeNull();
  });

  it("rejects approved amounts greater than expenditure amounts", () => {
    expect(
      getFundingCommentAmountValidationError({
        fundingStatusEnum: FundingStatusEnum.Partial,
        approvedAmount: 101,
        expenditureAmount: 100,
      }),
    ).toBe(FUNDING_APPROVED_AMOUNT_EXCEEDED_ERROR);
  });

  it("rejects approved status with a partial amount", () => {
    expect(
      getFundingCommentAmountValidationError({
        fundingStatusEnum: FundingStatusEnum.Approved,
        approvedAmount: 50,
        expenditureAmount: 100,
      }),
    ).toBe(FUNDING_APPROVED_STATUS_AMOUNT_ERROR);
  });

  it("allows approved status with the full amount", () => {
    expect(
      getFundingCommentAmountValidationError({
        fundingStatusEnum: FundingStatusEnum.Approved,
        approvedAmount: 100,
        expenditureAmount: 100,
      }),
    ).toBeNull();
  });

  it("allows non-approved status through the approved amount rule", () => {
    expect(
      getFundingCommentAmountValidationError({
        fundingStatusEnum: FundingStatusEnum.Rejected,
        approvedAmount: 50,
        expenditureAmount: 100,
      }),
    ).toBeNull();
  });

  it("rejects partial status with a zero approved amount", () => {
    expect(
      getFundingCommentAmountValidationError({
        fundingStatusEnum: FundingStatusEnum.Partial,
        approvedAmount: 0,
        expenditureAmount: 100,
      }),
    ).toBe(FUNDING_PARTIAL_STATUS_AMOUNT_ERROR);
  });

  it("rejects partial status with the full amount", () => {
    expect(
      getFundingCommentAmountValidationError({
        fundingStatusEnum: FundingStatusEnum.Partial,
        approvedAmount: 100,
        expenditureAmount: 100,
      }),
    ).toBe(FUNDING_PARTIAL_STATUS_AMOUNT_ERROR);
  });

  it("allows partial status with a nonzero partial amount", () => {
    expect(
      getFundingCommentAmountValidationError({
        fundingStatusEnum: FundingStatusEnum.Partial,
        approvedAmount: 50,
        expenditureAmount: 100,
      }),
    ).toBeNull();
  });

  it("allows non-partial status through the partial amount rule", () => {
    expect(
      getFundingCommentAmountValidationError({
        fundingStatusEnum: FundingStatusEnum.Rejected,
        approvedAmount: 0,
        expenditureAmount: 100,
      }),
    ).toBeNull();
  });
});
