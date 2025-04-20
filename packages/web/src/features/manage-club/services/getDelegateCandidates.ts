import { useQuery } from "@tanstack/react-query";

import type {
  ApiClb008RequestParam,
  ApiClb008ResponseOk,
} from "@clubs/interface/api/club/endpoint/apiClb008";
import apiClb008 from "@clubs/interface/api/club/endpoint/apiClb008";

import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

import { mockClubDelegateCandidates } from "./_mock/mockDelegate";

export const useGetDelegateCandidates = (requestParam: ApiClb008RequestParam) =>
  useQuery<ApiClb008ResponseOk, Error>({
    queryKey: [apiClb008.url(requestParam.clubId, requestParam.delegateEnumId)],
    queryFn: async (): Promise<ApiClb008ResponseOk> => {
      const { data } = await axiosClientWithAuth.get(
        apiClb008.url(requestParam.clubId, requestParam.delegateEnumId),
      );

      return data;
    },
  });

defineAxiosMock(mock => {
  mock
    .onGet(apiClb008.url(1, 1))
    .reply(() => [200, mockClubDelegateCandidates]);
});
