import { useSuspenseQuery } from "@tanstack/react-query";

import apiClb009, {
  ApiClb009RequestParam,
  ApiClb009ResponseOk,
} from "@clubs/interface/api/club/endpoint/apiClb009";

import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

import { mockAllSemesters } from "./_mock/mockMembers";

export const useGetClubSemesters = (requestParam: ApiClb009RequestParam) =>
  useSuspenseQuery<ApiClb009ResponseOk, Error>({
    queryKey: [apiClb009.url(requestParam.clubId)],
    queryFn: async (): Promise<ApiClb009ResponseOk> => {
      const { data } = await axiosClientWithAuth.get(
        apiClb009.url(requestParam.clubId),
      );

      return apiClb009.responseBodyMap[200].parse(data);
    },
  });

defineAxiosMock(mock => {
  mock
    .onGet(apiClb009.url(1))
    .reply(() => [200, { semesters: mockAllSemesters }]);
});
