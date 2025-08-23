import { useQueries } from "@tanstack/react-query";

import { ApiSem012ResponseOK } from "@clubs/interface/api/semester/apiSem012";
import { apiSem016 } from "@clubs/interface/api/semester/apiSem016";

import { defineAxiosMock } from "@sparcs-clubs/web/lib/axios";

import { fundingDeadlinesQueryFn } from "../services/useGetFundingDeadlines";

type ActivityDuration = ApiSem012ResponseOK["activityDurations"][number];

const useGetAllFundingDeadlines = (activityDurations: ActivityDuration[]) => {
  const reversedActivityDurations = [...activityDurations].reverse();

  const queries = useQueries({
    queries: reversedActivityDurations.map(activityDuration => ({
      queryKey: [apiSem016.url, activityDuration.id],
      queryFn: () =>
        fundingDeadlinesQueryFn({ activityDId: activityDuration.id }),
      enabled: reversedActivityDurations.length > 0,
    })),
  });

  const isLoading = queries.some(query => query.isLoading);
  const isError = queries.some(query => query.isError);
  const data = queries.map((query, index) => ({
    activityDuration: reversedActivityDurations[index],
    fundingDeadlines: query.data,
  }));

  return {
    data,
    isLoading,
    isError,
  };
};

export default useGetAllFundingDeadlines;

defineAxiosMock(mock => {
  mock.onGet(apiSem016.url).reply(() => [200, { deadlines: [] }]);
});
