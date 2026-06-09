import { useMemo } from "react";

import useGetActivityDurations from "@sparcs-clubs/web/features/executive/services/useGetActivityDurations";
import { filterRegularActivityDurations } from "@sparcs-clubs/web/features/executive/utils/activityDuration";

import useGetFundingDeadlines from "../services/useGetFundingDeadlines";
import { groupFundingDeadlinesByActivityDuration } from "./groupFundingDeadlines";

const useGroupFundingDeadlines = () => {
  const {
    data: deadlineResponse,
    isLoading: isDeadlinesLoading,
    isError: isDeadlinesError,
  } = useGetFundingDeadlines();

  const {
    data: activityDurationsResponse,
    isLoading: isActivityDurationsLoading,
    isError: isActivityDurationsError,
  } = useGetActivityDurations();

  const groupedData = useMemo(() => {
    if (
      !deadlineResponse?.deadlines ||
      !activityDurationsResponse?.activityDurations
    ) {
      return [];
    }

    const regularActivityDurations = filterRegularActivityDurations(
      activityDurationsResponse.activityDurations,
    );

    return groupFundingDeadlinesByActivityDuration(
      regularActivityDurations,
      deadlineResponse.deadlines,
    );
  }, [
    activityDurationsResponse?.activityDurations,
    deadlineResponse?.deadlines,
  ]);

  return {
    data: groupedData,
    isLoading: isDeadlinesLoading || isActivityDurationsLoading,
    isError: isDeadlinesError || isActivityDurationsError,
  };
};

export default useGroupFundingDeadlines;
