import { useQueries } from "@tanstack/react-query";

import { ApiSem012ResponseOK } from "@clubs/interface/api/semester/apiSem012";
import { apiSem016 } from "@clubs/interface/api/semester/apiSem016";

import { defineAxiosMock } from "@sparcs-clubs/web/lib/axios";

import { fundingDeadlinesQueryFn } from "../services/useGetFundingDeadlines";

type ActivityDuration = ApiSem012ResponseOK["activityDurations"][number];

const useGetAllFundingDeadlines = (activityDurations: ActivityDuration[]) => {
  const queries = useQueries({
    queries: activityDurations.map(activityDuration => ({
      queryKey: [apiSem016.url, activityDuration.id],
      queryFn: () =>
        fundingDeadlinesQueryFn({ activityDId: activityDuration.id }),
      enabled: activityDurations.length > 0,
    })),
  });

  const isLoading = queries.some(query => query.isLoading);
  const isError = queries.some(query => query.isError);
  const data = queries.map((query, index) => ({
    activityDuration: activityDurations[index],
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
