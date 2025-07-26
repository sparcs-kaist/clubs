import { useQueries } from "@tanstack/react-query";

import { ApiAct009ResponseOk } from "@clubs/interface/api/activity/endpoint/apiAct009";
import { ApiFnd009ResponseOk } from "@clubs/interface/api/funding/endpoint/apiFnd009";

import useGetActivityTerms from "@sparcs-clubs/web/features/activity-report/services/useGetActivityTerms";
import useGetFundingDeadline from "@sparcs-clubs/web/features/manage-club/funding/services/useGetFundingDeadline";

import { executiveClubFundingForDurationQueryFn } from "../services/useGetExecutiveClubFundingForDuration";

const useGetExecutiveClubFunding = (
  clubId: number,
): {
  data: {
    term: ApiAct009ResponseOk["terms"][number];
    items: ApiFnd009ResponseOk | null;
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
  } = useGetFundingDeadline();

  const pastActivityTerms = activityTerms?.terms.toReversed().filter(term => {
    if (!deadline) return true;

    // 신규 지원금(현재 신청 중인 활동 기간) 빼고, 과거 지원금(과거 활동 기간)만 보여주기
    return (
      new Date(term.startTerm).getTime() !==
        new Date(deadline.targetDuration.startTerm).getTime() &&
      new Date(term.endTerm).getTime() !==
        new Date(deadline.targetDuration.endTerm).getTime()
    );
  });

  const queries = useQueries({
    queries: (pastActivityTerms ?? []).map(activityTerm => ({
      queryKey: ["getExecutiveClubFunding", clubId, activityTerm.id],
      queryFn: () =>
        executiveClubFundingForDurationQueryFn(Number(clubId), {
          activityDurationId: activityTerm.id,
        }),
      retry: false,
      enabled: !!activityTerms,
    })),
  });

  const successDataList = queries.map(query =>
    query.isSuccess ? query.data : null,
  );

  return {
    data:
      pastActivityTerms?.map((term, index) => ({
        term,
        items: successDataList[index],
      })) ?? [],
    isLoading:
      isLoading || isLoadingDeadline || queries.some(query => query.isLoading),
    isError:
      isError || isErrorDeadline || queries.every(query => query.isError),
  };
};

export default useGetExecutiveClubFunding;
