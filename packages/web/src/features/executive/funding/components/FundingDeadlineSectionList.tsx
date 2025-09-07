import React from "react";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import useGetActivityDurations from "@sparcs-clubs/web/features/executive/services/useGetActivityDurations";

import useGetAllFundingDeadlines from "../hooks/useGetAllFundingDeadlines";
import FundingDeadlineSection from "./FundingDeadlineSection";

const FundingDeadlineSectionList: React.FC = () => {
  const {
    data: activityDurationsData,
    isLoading: isActivityDurationsLoading,
    isError: isActivityDurationsError,
  } = useGetActivityDurations();

  const {
    data: allFundingDeadlinesData,
    isLoading: isFundingDeadlinesLoading,
    isError: isFundingDeadlinesError,
  } = useGetAllFundingDeadlines(activityDurationsData?.activityDurations || []);

  const isLoading = isActivityDurationsLoading || isFundingDeadlinesLoading;
  const isError = isActivityDurationsError || isFundingDeadlinesError;

  return (
    <AsyncBoundary isLoading={isLoading} isError={isError}>
      <FlexWrapper direction="column" gap={30}>
        {allFundingDeadlinesData?.map(
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
