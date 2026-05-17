import React from "react";

import { ClubTypeEnum } from "@clubs/domain/club/club-semester";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import FoldableSection from "@sparcs-clubs/web/common/components/FoldableSection";
import FoldableSectionTitle from "@sparcs-clubs/web/common/components/FoldableSectionTitle";
import Typography from "@sparcs-clubs/web/common/components/Typography";

import useGetExecutiveClubFunding from "../hooks/useGetExecutiveClubFunding";
import formatActivityDurationName, {
  defaultActivityDuration,
} from "../utils/formatActivityDuration";
import ExecutiveClubFundingsTable from "./ExecutiveClubFundingsTable";

interface ExecutivePastFundingSectionProps {
  clubId: string;
}

const ExecutivePastFundingSection: React.FC<
  ExecutivePastFundingSectionProps
> = ({ clubId }) => {
  const {
    data: dataList,
    isLoading,
    isError,
  } = useGetExecutiveClubFunding(+clubId);

  const defaultData = {
    activityDuration: defaultActivityDuration,
    club: {
      id: Number(clubId),
      name: "",
      nameEn: "",
      typeEnum: ClubTypeEnum.Regular,
      division: {
        id: 0,
      },
      professor: {
        id: 0,
      },
    },
    totalCount: 0,
    appliedCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    committeeCount: 0,
    partialCount: 0,
    fundings: [],
    chargedExecutive: null,
  };

  return (
    <FoldableSectionTitle title="과거 지원금" childrenMargin="30px">
      <AsyncBoundary isLoading={isLoading} isError={isError}>
        <FlexWrapper direction="column" gap={30}>
          {dataList.length === 0 && (
            <Typography color="GRAY.300" fs={16} lh={24}>
              과거 지원금 신청 내역이 없습니다
            </Typography>
          )}
          {dataList.map(data => (
            <FoldableSection
              key={data.activityDuration.id}
              title={`${formatActivityDurationName(data.items?.activityDuration ?? data.activityDuration)} (총 ${data.items?.fundings ? data.items.fundings.length : 0}개)`}
              childrenMargin="20px"
            >
              {data.items == null ? (
                <AsyncBoundary isLoading={false} isError />
              ) : (
                <ExecutiveClubFundingsTable
                  data={data?.items ? data.items : defaultData}
                  isPast
                />
              )}
            </FoldableSection>
          ))}
        </FlexWrapper>
      </AsyncBoundary>
    </FoldableSectionTitle>
  );
};

export default ExecutivePastFundingSection;
