import { useSuspenseQuery } from "@tanstack/react-query";

import apiClb010, {
  ApiClb010RequestParam,
  ApiClb010ResponseOk,
} from "@sparcs-clubs/interface/api/club/endpoint/apiClb010";

import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

import { mockSemesterMembers } from "./_mock/mockMembers";

export async function getClubMembers(clubId: number, semesterId: number) {
  const { data } = await axiosClientWithAuth.get(
    apiClb010.url(clubId, semesterId),
  );
  return data;
}

export const useGetClubMembers = (requestParam: ApiClb010RequestParam) =>
  useSuspenseQuery<ApiClb010ResponseOk, Error>({
    queryKey: [apiClb010.url(requestParam.clubId, requestParam.semesterId)],
    queryFn: async (): Promise<ApiClb010ResponseOk> => {
      const { data } = await axiosClientWithAuth.get(
        apiClb010.url(requestParam.clubId, requestParam.semesterId),
      );

      // return apiClb010.responseBodyMap[200].parse(data);
      return data;
    },
  });

defineAxiosMock(mock => {
  mock
    .onGet(apiClb010.url(1, 15))
    .reply(() => [200, { members: mockSemesterMembers }]);
});
