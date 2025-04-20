import { useQuery } from "@tanstack/react-query";

import apiMee005, {
  ApiMee005RequestQuery,
  ApiMee005ResponseOk,
} from "@clubs/interface/api/meeting/apiMee005";

import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

const useGetMeetingDegree = (query: ApiMee005RequestQuery) =>
  useQuery<ApiMee005ResponseOk, Error>({
    queryKey: [apiMee005.url()],
    queryFn: async (): Promise<ApiMee005ResponseOk> => {
      const { data } = await axiosClientWithAuth.get(apiMee005.url(), {
        params: query,
      });

      return apiMee005.responseBodyMap[200].parse(data);
    },
  });

export default useGetMeetingDegree;

defineAxiosMock(mock => {
  mock.onGet(apiMee005.url()).reply(() => [200, { degree: 100 }]);
});
