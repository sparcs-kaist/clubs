import { useQuery } from "@tanstack/react-query";

import {
  apiSem019,
  ApiSem019RequestQuery,
  ApiSem019ResponseOk,
} from "@clubs/interface/api/semester/apiSem019";

import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

export const registrationDeadlinesQueryFn = async (
  query: ApiSem019RequestQuery,
): Promise<ApiSem019ResponseOk> => {
  try {
    const { data } = await axiosClientWithAuth.get(apiSem019.url, {
      params: query,
    });

    return data;
  } catch (error) {
    return Promise.reject(error);
  }
};

const useGetRegistrationDeadlines = (query: ApiSem019RequestQuery = {}) =>
  useQuery<ApiSem019ResponseOk, Error>({
    queryKey: [apiSem019.url, query.semesterId],
    queryFn: () => registrationDeadlinesQueryFn(query),
  });

export default useGetRegistrationDeadlines;

defineAxiosMock(mock => {
  mock.onGet(apiSem019.url).reply(() => [200, { deadlines: [] }]);
});
