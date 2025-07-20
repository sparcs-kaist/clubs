import { useQuery } from "@tanstack/react-query";

import {
  apiClb011,
  type ApiClb011RequestParam,
  type ApiClb011ResponseOk,
} from "@clubs/interface/api/club/index";

import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

import { mockClubDelegateRequest } from "./_mock/mockDelegate";

export const useGetChangeDelegateRequests = (
  requestParam: ApiClb011RequestParam,
) =>
  useQuery<ApiClb011ResponseOk, Error>({
    queryKey: [apiClb011.url(requestParam.clubId)],
    queryFn: async (): Promise<ApiClb011ResponseOk> => {
      const { data } = await axiosClientWithAuth.get(
        apiClb011.url(requestParam.clubId),
      );

      return data;
    },
  });

defineAxiosMock(mock => {
  mock.onGet(apiClb011.url(1)).reply(() => [200, mockClubDelegateRequest]);
});
