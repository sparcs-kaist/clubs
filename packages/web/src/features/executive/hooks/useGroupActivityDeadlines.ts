import { useMemo } from "react";

import { ApiSem007ResponseOK } from "@clubs/interface/api/semester/apiSem007";
import { ApiSem012ResponseOK } from "@clubs/interface/api/semester/apiSem012";

import useGetActivityDeadlines from "../services/getActivityDeadlines";
import useGetActivityDurations from "../services/useGetActivityDurations";

interface GroupedActivityDeadline {
  activityDuration: ApiSem012ResponseOK["activityDurations"][number];
  deadlines: ApiSem007ResponseOK["deadlines"];
}

const useGroupActivityDeadlines = () => {
  const {
    data: deadlineResponse,
    isLoading: isDeadlinesLoading,
    isError: isDeadlinesError,
  } = useGetActivityDeadlines();

  const {
    data: activityDurationsResponse,
    isLoading: isActivityDurationsLoading,
    isError: isActivityDurationsError,
  } = useGetActivityDurations();

  const groupedData = useMemo((): GroupedActivityDeadline[] => {
    if (
      !deadlineResponse?.deadlines ||
      !activityDurationsResponse?.activityDurations
    ) {
      return [];
    }

    const { deadlines } = deadlineResponse;
    const { activityDurations } = activityDurationsResponse;

    // 활동 기간별로 deadline 그룹핑
    const groupedMap = new Map<number, ApiSem007ResponseOK["deadlines"]>();

    deadlines.forEach(deadline => {
      const existingDeadlines = groupedMap.get(deadline.activityDId) || [];
      groupedMap.set(deadline.activityDId, [...existingDeadlines, deadline]);
    });

    // 활동 기간 정보와 해당 deadline들을 조합
    const result = activityDurations
      .map(activityDuration => {
        const deadlinesForDuration = groupedMap.get(activityDuration.id) || [];

        // deadline이 있는 활동 기간만 포함
        if (deadlinesForDuration.length === 0) {
          return null;
        }

        // deadline을 종료일 기준으로 내림차순 정렬
        const sortedDeadlines = deadlinesForDuration.sort(
          (a, b) =>
            new Date(b.endTerm).getTime() - new Date(a.endTerm).getTime(),
        );

        return {
          activityDuration,
          deadlines: sortedDeadlines,
        };
      })
      .filter((item): item is GroupedActivityDeadline => item !== null)
      // 활동 기간을 최신 순으로 정렬
      .sort(
        (a, b) =>
          b.activityDuration.semester.id - a.activityDuration.semester.id,
      );

    return result;
  }, [
    deadlineResponse?.deadlines,
    activityDurationsResponse?.activityDurations,
  ]);

  return {
    data: groupedData,
    isLoading: isDeadlinesLoading || isActivityDurationsLoading,
    isError: isDeadlinesError || isActivityDurationsError,
  };
};

export default useGroupActivityDeadlines;
export type { GroupedActivityDeadline };
