import { Divider } from "@mui/material";
import React from "react";
import styled from "styled-components";

import { ApiFnd009ResponseOk } from "@clubs/interface/api/funding/endpoint/apiFnd009";

import Card from "@sparcs-clubs/web/common/components/Card";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import Tag from "@sparcs-clubs/web/common/components/Tag";
import Toggle from "@sparcs-clubs/web/common/components/Toggle";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import { TotalContentsContainer } from "@sparcs-clubs/web/features/executive/register-member/components/StatusInfoFrame";
import { formatCurrency } from "@sparcs-clubs/web/utils/format";

interface FundingClubStatisticProps {
  data: ApiFnd009ResponseOk;
}

const StatisticWrapper = styled.div`
  display: flex;
  flex-direction: row;
  gap: 20px;
  width: 160px;
`;

const FundingClubStatistic: React.FC<FundingClubStatisticProps> = ({
  data,
}) => {
  const reviewedTotalCount =
    data.approvedCount +
    data.rejectedCount +
    data.committeeCount +
    data.partialCount;

  const totalApprovedAmount = data.fundings.reduce(
    (sum, funding) => sum + (funding.approvedAmount ?? 0),
    0,
  );

  const totalExpenditureAmount = data.fundings.reduce(
    (sum, funding) => sum + (funding.expenditureAmount ?? 0),
    0,
  );

  return (
    <Card gap={16} padding="16px" outline>
      <Toggle label={<Typography>지원금 통계</Typography>}>
        <FlexWrapper direction="column" gap={8} style={{ width: "100%" }}>
          <FlexWrapper direction="row" gap={40}>
            <StatisticWrapper>
              <Typography fw="MEDIUM" fs={16} lh={20}>
                담당자
              </Typography>
              <Typography
                fs={16}
                lh={20}
                style={{ flex: 1, textAlign: "center" }}
              >
                {data.chargedExecutive?.name || "-"}
              </Typography>
            </StatisticWrapper>
            <FlexWrapper direction="row" gap={20}>
              <Typography fw="MEDIUM" fs={16} lh={20}>
                검토율
              </Typography>
              <Typography fs={16} lh={20}>
                {reviewedTotalCount}개 / {data.totalCount}개 (
                {data.totalCount === 0
                  ? "0.0"
                  : ((reviewedTotalCount / data.totalCount) * 100).toFixed(1)}
                %)
              </Typography>
            </FlexWrapper>
            <FlexWrapper direction="row" gap={20}>
              <Typography fw="MEDIUM" fs={16} lh={20}>
                승인율
              </Typography>
              <Typography fs={16} lh={20}>
                {data.approvedCount}개 / {data.totalCount}개 (
                {data.totalCount === 0
                  ? "0.0"
                  : ((data.approvedCount / data.totalCount) * 100).toFixed(1)}
                %)
              </Typography>
            </FlexWrapper>
          </FlexWrapper>
          <Divider />
          <FlexWrapper direction="row" gap={40}>
            <StatisticWrapper>
              <Tag color="GRAY">대기</Tag>
              <TotalContentsContainer>
                {data.appliedCount}개
              </TotalContentsContainer>
            </StatisticWrapper>
            <StatisticWrapper>
              <Tag color="GREEN">승인</Tag>
              <TotalContentsContainer>
                {data.approvedCount}개
              </TotalContentsContainer>
            </StatisticWrapper>
            <StatisticWrapper>
              <Tag color="PURPLE">부분 승인</Tag>
              <TotalContentsContainer>
                {data.partialCount}개
              </TotalContentsContainer>
            </StatisticWrapper>
            <StatisticWrapper>
              <Tag color="RED">반려</Tag>
              <TotalContentsContainer>
                {data.rejectedCount}개
              </TotalContentsContainer>
            </StatisticWrapper>
            <StatisticWrapper>
              <Tag color="YELLOW">운위</Tag>
              <TotalContentsContainer>
                {data.committeeCount}개
              </TotalContentsContainer>
            </StatisticWrapper>
          </FlexWrapper>
          <Divider />
          <FlexWrapper direction="row" gap={40}>
            <FlexWrapper direction="row" gap={20}>
              <Typography fw="MEDIUM" fs={16} lh={20}>
                승인 금액
              </Typography>
              <Typography fs={16} lh={20}>
                {formatCurrency(totalApprovedAmount)}원
              </Typography>
            </FlexWrapper>
            <FlexWrapper direction="row" gap={20}>
              <Typography fw="MEDIUM" fs={16} lh={20}>
                신청 금액
              </Typography>
              <Typography fs={16} lh={20}>
                {formatCurrency(totalExpenditureAmount)}원
              </Typography>
            </FlexWrapper>
          </FlexWrapper>
        </FlexWrapper>
      </Toggle>
    </Card>
  );
};

export default FundingClubStatistic;
