import { Divider } from "@mui/material";
import React from "react";
import styled from "styled-components";

import Card from "@sparcs-clubs/web/common/components/Card";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import Tag, { TagColor } from "@sparcs-clubs/web/common/components/Tag";
import Toggle from "@sparcs-clubs/web/common/components/Toggle";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import { TotalContentsContainer } from "@sparcs-clubs/web/features/executive/register-member/components/StatusInfoFrame";

interface ActivityReportStatisticProps {
  pendingTotalCount: number;
  approvedTotalCount: number;
  rejectedTotalCount: number;
  chargedExecutiveName?: string;
  withChargedExecutive?: boolean;
  withApprovedRate?: boolean;
}

const StatisticWrapper = styled.div`
  display: flex;
  flex-direction: row;
  gap: 20px;
  width: 160px;
`;

const ActivityReportStatistic: React.FC<ActivityReportStatisticProps> = ({
  pendingTotalCount,
  approvedTotalCount,
  rejectedTotalCount,
  chargedExecutiveName = "-",
  withChargedExecutive = false,
  withApprovedRate = false,
}) => {
  const statisticTypes = [
    { color: "GRAY", text: "대기", data: pendingTotalCount },
    { color: "GREEN", text: "승인", data: approvedTotalCount },
    { color: "RED", text: "반려", data: rejectedTotalCount },
  ];

  const reviewedTotalCount = approvedTotalCount + rejectedTotalCount;
  const totalCount =
    pendingTotalCount + approvedTotalCount + rejectedTotalCount;

  return (
    <Card gap={16} padding="16px" outline>
      <Toggle label={<Typography>활동 보고서 통계</Typography>}>
        <FlexWrapper direction="column" gap={8} style={{ width: "100%" }}>
          <FlexWrapper direction="row" gap={40}>
            {withChargedExecutive && (
              <StatisticWrapper>
                <Typography fw="MEDIUM" fs={16} lh={20}>
                  담당자
                </Typography>
                <Typography
                  fs={16}
                  lh={20}
                  style={{ flex: 1, textAlign: "center" }}
                >
                  {chargedExecutiveName}
                </Typography>
              </StatisticWrapper>
            )}
            <FlexWrapper direction="row" gap={20}>
              <Typography fw="MEDIUM" fs={16} lh={20}>
                검토율
              </Typography>
              <Typography fs={16} lh={20}>
                {reviewedTotalCount}개 / {totalCount}개 (
                {((reviewedTotalCount / totalCount) * 100).toFixed(1)}%)
              </Typography>
            </FlexWrapper>
            {withApprovedRate && (
              <FlexWrapper direction="row" gap={20}>
                <Typography fw="MEDIUM" fs={16} lh={20}>
                  승인율
                </Typography>
                <Typography fs={16} lh={20}>
                  {approvedTotalCount}개 / {totalCount}개 (
                  {((approvedTotalCount / totalCount) * 100).toFixed(1)}%)
                </Typography>
              </FlexWrapper>
            )}
          </FlexWrapper>
          <Divider />
          <FlexWrapper direction="row" gap={40}>
            {statisticTypes.map(statisticType => (
              <StatisticWrapper key={statisticType.text}>
                <Tag color={statisticType.color as TagColor}>
                  {statisticType.text}
                </Tag>
                <TotalContentsContainer>
                  {statisticType.data}개
                </TotalContentsContainer>
              </StatisticWrapper>
            ))}
          </FlexWrapper>
        </FlexWrapper>
      </Toggle>
    </Card>
  );
};

export default ActivityReportStatistic;
