import { useQuery } from "@tanstack/react-query";

import apiAct009, {
  ApiAct009RequestQuery,
  ApiAct009ResponseOk,
} from "@clubs/interface/api/activity/endpoint/apiAct009";

import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

export const activityTermsQueryKey = (clubId: number) => [
  apiAct009.url(),
  clubId,
];

const useGetActivityTerms = (query: ApiAct009RequestQuery) =>
  useQuery<ApiAct009ResponseOk, Error>({
    queryKey: activityTermsQueryKey(query.clubId),
    queryFn: async (): Promise<ApiAct009ResponseOk> => {
      const { data } = await axiosClientWithAuth.get(apiAct009.url(), {
        params: query,
      });

      return apiAct009.responseBodyMap[200].parse(data);
    },
  });

export default useGetActivityTerms;

defineAxiosMock(mock => {
  mock.onGet(apiAct009.url()).reply(() => [
    200,
    {
      terms: [
        {
          id: 1,
          year: 2023,
          name: "가을",
          startTerm: "2023-01-01T07:16:56.000Z",
          endTerm: "2023-06-01T07:16:55.000Z",
        },
        {
          id: 4,
          year: 2023,
          name: "봄",
          startTerm: "2023-07-04T07:16:57.000Z",
          endTerm: "2023-11-30T00:00:00.000Z",
        },
        {
          id: 5,
          year: 2022,
          name: "가을",
          startTerm: "2023-12-01T00:00:00.000Z",
          endTerm: "2023-03-01T00:00:00.000Z",
        },
      ],
    },
  ]);
});
