import { useQueries } from "@tanstack/react-query";

import { ApiAct024ResponseOk } from "@clubs/interface/api/activity/endpoint/apiAct024";

import useGetExecutiveClubActivitiesForDuration, {
  executiveClubActivitiesForDurationQueryFn,
} from "../services/executive/useGetExecutiveClubActivitiesForDuration";

const useGetExecutiveClubActivities = (
  clubId: number,
): {
  data: {
    activityDuration: ApiAct024ResponseOk["activityDuration"];
    activities: ApiAct024ResponseOk | null;
  }[];
  isLoading: boolean;
  isError: boolean;
} => {
  const {
    data: currentActivities,
    isLoading: isCurrentActivitiesLoading,
    isError: isCurrentActivitiesError,
  } = useGetExecutiveClubActivitiesForDuration({
    clubId,
  });

  const pastActivityDurations = currentActivities?.pastActivityDurations ?? [];

  const queries = useQueries({
    queries: pastActivityDurations.map(activityDuration => ({
      queryKey: [
        "getExecutiveClubActivities",
        clubId,
        activityDuration.semester.id,
      ],
      queryFn: () =>
        executiveClubActivitiesForDurationQueryFn({
          clubId: Number(clubId),
          semesterId: activityDuration.semester.id,
        }),
      retry: false,
      enabled: !!currentActivities,
    })),
  });

  const successDataList = queries.map(query =>
    query.isSuccess ? query.data : null,
  );

  return {
    data: pastActivityDurations
      .map((activityDuration, index) => ({
        activityDuration:
          successDataList[index]?.activityDuration ?? activityDuration,
        activities: successDataList[index],
      }))
      .filter(
        data => data.activities == null || data.activities.items.length > 0,
      ),
    isLoading:
      isCurrentActivitiesLoading || queries.some(query => query.isLoading),
    isError:
      isCurrentActivitiesError ||
      (queries.length > 0 && queries.every(query => query.isError)),
  };
};

export default useGetExecutiveClubActivities;
