import React from "react";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";

import ActivityDeadlineSection from "../components/ActivityDeadlineSection";
import useGroupActivityDeadlines from "../hooks/useGroupActivityDeadlines";

const ManageActivityDeadlineFrame: React.FC = () => {
  const {
    data: groupedDeadlines,
    isLoading,
    isError,
  } = useGroupActivityDeadlines();

  return (
    <AsyncBoundary isLoading={isLoading} isError={isError}>
      <FlexWrapper direction="column" gap={30}>
        {groupedDeadlines?.map(groupedDeadline => (
          <ActivityDeadlineSection
            key={groupedDeadline.activityDuration.id}
            groupedDeadline={groupedDeadline}
          />
        ))}
      </FlexWrapper>
    </AsyncBoundary>
  );
};

export default ManageActivityDeadlineFrame;
