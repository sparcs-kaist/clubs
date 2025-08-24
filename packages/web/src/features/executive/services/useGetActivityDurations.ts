import { useQuery } from "@tanstack/react-query";

import {
  apiSem012,
  ApiSem012RequestQuery,
  ApiSem012ResponseOK,
} from "@clubs/interface/api/semester/apiSem012";

import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

export const activityDurationsQueryFn = async (
  query: ApiSem012RequestQuery,
): Promise<ApiSem012ResponseOK> => {
  try {
    const { data } = await axiosClientWithAuth.get(apiSem012.url(), {
      params: query,
    });

    return data;
  } catch (error) {
    return Promise.reject(error);
  }
};

const useGetActivityDurations = (query: ApiSem012RequestQuery = {}) =>
  useQuery<ApiSem012ResponseOK, Error>({
    queryKey: [apiSem012.url(), query.semesterId],
    queryFn: () => activityDurationsQueryFn(query),
  });

export default useGetActivityDurations;

defineAxiosMock(mock => {
  mock.onGet(apiSem012.url()).reply(() => [200, { activityDurations: [] }]);
});
