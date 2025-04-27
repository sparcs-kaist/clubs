import { useQueries } from "@tanstack/react-query";

import { ApiAct009ResponseOk } from "@clubs/interface/api/activity/endpoint/apiAct009";
import { ApiAct024ResponseOk } from "@clubs/interface/api/activity/endpoint/apiAct024";

import { executiveClubActivitiesForDurationQueryFn } from "../services/executive/useGetExecutiveClubActivitiesForDuration";
import useGetActivityDeadline from "../services/useGetActivityDeadline";
import useGetActivityTerms from "../services/useGetActivityTerms";

const useGetExecutiveClubActivities = (
  clubId: number,
): {
  data: {
    term: ApiAct009ResponseOk["terms"][number];
    activities: ApiAct024ResponseOk;
  }[];
  isLoading: boolean;
  isError: boolean;
} => {
  const {
    data: activityTerms,
    isLoading,
    isError,
  } = useGetActivityTerms({
    clubId,
  });

  const {
    data: deadline,
    isLoading: isLoadingDeadline,
    isError: isErrorDeadline,
  } = useGetActivityDeadline();

  const pastActivityTerms = activityTerms?.terms.toReversed().filter(term => {
    if (!deadline) return true;

    // 신규 활동 보고서는 빼고, 과거 활동 보고서만 보여주기
    return (
      new Date(term.startTerm).getTime() !==
        new Date(deadline.targetTerm.startTerm).getTime() &&
      new Date(term.endTerm).getTime() !==
        new Date(deadline.targetTerm.endTerm).getTime()
    );
  });

  const queries = useQueries({
    queries: (pastActivityTerms ?? []).map(activityTerm => ({
      queryKey: ["getExecutiveClubActivities", clubId, activityTerm.id],
      queryFn: () =>
        executiveClubActivitiesForDurationQueryFn({
          clubId: Number(clubId),
          activityDurationId: activityTerm.id,
        }),
      retry: false,
      enabled: !!activityTerms,
    })),
  });

  const successDataList = queries
    .map(query => (query.isSuccess ? query.data : []))
    .filter((data): data is ApiAct024ResponseOk => data !== null);

  return {
    data:
      pastActivityTerms?.map((term, index) => ({
        term,
        activities: successDataList[index],
      })) ?? [],
    isLoading:
      isLoading || isLoadingDeadline || queries.some(query => query.isLoading),
    isError:
      isError || isErrorDeadline || queries.every(query => query.isError),
  };
};

export default useGetExecutiveClubActivities;
