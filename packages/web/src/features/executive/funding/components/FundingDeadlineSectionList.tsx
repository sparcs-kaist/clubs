import React from "react";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";

import useGroupFundingDeadlines from "../hooks/useGroupFundingDeadlines";
import FundingDeadlineSection from "./FundingDeadlineSection";

const FundingDeadlineSectionList: React.FC = () => {
  const {
    data: groupedFundingDeadlines,
    isLoading,
    isError,
  } = useGroupFundingDeadlines();

  return (
    <AsyncBoundary isLoading={isLoading} isError={isError}>
      <FlexWrapper direction="column" gap={30}>
        {groupedFundingDeadlines.map(
          ({ activityDuration, fundingDeadlines }) => (
            <FundingDeadlineSection
              key={activityDuration.id}
              activityDuration={activityDuration}
              fundingDeadlines={fundingDeadlines}
            />
          ),
        )}
      </FlexWrapper>
    </AsyncBoundary>
  );
};

export default FundingDeadlineSectionList;
