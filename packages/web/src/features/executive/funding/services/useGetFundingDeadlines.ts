import { useQuery } from "@tanstack/react-query";

import {
  apiSem016,
  ApiSem016RequestQuery,
  ApiSem016ResponseOk,
} from "@clubs/interface/api/semester/apiSem016";

import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

export const fundingDeadlinesQueryFn = async (
  query: ApiSem016RequestQuery,
): Promise<ApiSem016ResponseOk> => {
  try {
    const { data } = await axiosClientWithAuth.get(apiSem016.url, {
      params: query,
    });

    return data;
  } catch (error) {
    return Promise.reject(error);
  }
};

const useGetFundingDeadlines = (query: ApiSem016RequestQuery = {}) =>
  useQuery<ApiSem016ResponseOk, Error>({
    queryKey: [apiSem016.url, query.activityDId],
    queryFn: () => fundingDeadlinesQueryFn(query),
  });

export default useGetFundingDeadlines;

defineAxiosMock(mock => {
  mock.onGet(apiSem016.url).reply(() => [200, { deadlines: [] }]);
});
