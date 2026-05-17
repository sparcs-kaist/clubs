import { useQueries } from "@tanstack/react-query";

import { ApiFnd009ResponseOk } from "@clubs/interface/api/funding/endpoint/apiFnd009";

import useGetExecutiveClubFundingForDuration, {
  executiveClubFundingForDurationQueryFn,
} from "../services/useGetExecutiveClubFundingForDuration";

const useGetExecutiveClubFunding = (
  clubId: number,
): {
  data: {
    activityDuration: ApiFnd009ResponseOk["activityDuration"];
    items: ApiFnd009ResponseOk | null;
  }[];
  isLoading: boolean;
  isError: boolean;
} => {
  const {
    data: currentFunding,
    isLoading: isCurrentFundingLoading,
    isError: isCurrentFundingError,
  } = useGetExecutiveClubFundingForDuration(clubId, {});

  const pastActivityDurations = currentFunding?.pastActivityDurations ?? [];

  const queries = useQueries({
    queries: pastActivityDurations.map(activityDuration => ({
      queryKey: [
        "getExecutiveClubFunding",
        clubId,
        activityDuration.semester.id,
      ],
      queryFn: () =>
        executiveClubFundingForDurationQueryFn(Number(clubId), {
          semesterId: activityDuration.semester.id,
        }),
      retry: false,
      enabled: !!currentFunding,
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
        items: successDataList[index],
      }))
      .filter(data => data.items == null || data.items.fundings.length > 0),
    isLoading:
      isCurrentFundingLoading || queries.some(query => query.isLoading),
    isError:
      isCurrentFundingError ||
      (queries.length > 0 && queries.every(query => query.isError)),
  };
};

export default useGetExecutiveClubFunding;
