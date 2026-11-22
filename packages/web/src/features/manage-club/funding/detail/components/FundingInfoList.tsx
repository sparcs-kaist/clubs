import Link from "next/link";
import * as React from "react";
import styled from "styled-components";

import { IFundingResponse } from "@clubs/interface/api/funding/type/funding.type";

import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import { NO_ACTIVITY_REPORT_FUNDING } from "@sparcs-clubs/web/features/manage-club/funding/constants";
import { formatPurchaseReceiptUnitPrice } from "@sparcs-clubs/web/features/manage-club/funding/utils/purchaseReceipt";
import { formatDate } from "@sparcs-clubs/web/utils/Date/formatDate";
import { formatCurrency } from "@sparcs-clubs/web/utils/format";

interface FundingInfoListProps {
  data: IFundingResponse;
  isExecutive?: boolean;
}

export const ListItem = styled.div`
  display: flex;
  align-items: center;
  font-family: ${({ theme }) => theme.fonts.FAMILY.PRETENDARD};
  font-weight: ${({ theme }) => theme.fonts.WEIGHT.REGULAR};
  font-size: 16px;
  line-height: 20px;
  color: ${({ theme }) => theme.colors.BLACK};

  &:before {
    content: "•";
    padding-left: 8px;
    padding-right: 8px;
  }
`;

function renderPurposeActivity(
  purposeActivity: IFundingResponse["purposeActivity"],
  isExecutive: boolean = false,
) {
  if (!purposeActivity?.name) {
    return <span>{NO_ACTIVITY_REPORT_FUNDING}</span>;
  }
  return (
    <>
      {isExecutive ? (
        <Link
          href={`/executive/activity-report/${purposeActivity.id}`}
          style={{ color: "inherit", textDecoration: "underline" }}
        >
          {purposeActivity.name}
        </Link>
      ) : (
        <span>{purposeActivity.name}</span>
      )}
    </>
  );
}

const FundingInfoList: React.FC<FundingInfoListProps> = ({
  data,
  isExecutive,
}) => {
  const receipt = data.purchaseReceipt;

  return (
    <FlexWrapper direction="column" gap={16}>
      <Typography
        ff="PRETENDARD"
        fw="MEDIUM"
        fs={16}
        lh={20}
        color="BLACK"
        style={{ paddingLeft: 2, paddingRight: 2 }}
      >
        지원금 정보
      </Typography>
      <ListItem>항목명: {data.name}</ListItem>
      <ListItem>
        <span>지출 목적:</span>&nbsp;
        {renderPurposeActivity(data.purposeActivity, isExecutive)}
      </ListItem>
      <ListItem>지출 일자: {formatDate(data.expenditureDate)}</ListItem>
      <ListItem>
        {receipt ? "이 품목의 결제 금액" : "지출 금액"}:{" "}
        {formatCurrency(data.expenditureAmount)}원
      </ListItem>
      {receipt && (
        <>
          <ListItem>거래처와 영수증 번호: {receipt.reference}</ListItem>
          <ListItem>
            영수증 전체 결제 금액: {formatCurrency(receipt.totalAmount)}원
          </ListItem>
          <ListItem>영수증 내 품목 줄 번호: {receipt.itemNumber}</ListItem>
          <ListItem>이 품목의 개수: {receipt.quantity}</ListItem>
          <ListItem>
            개당 가격:{" "}
            {formatPurchaseReceiptUnitPrice(
              data.expenditureAmount,
              receipt.quantity,
            )}
          </ListItem>
        </>
      )}
    </FlexWrapper>
  );
};

export default FundingInfoList;
