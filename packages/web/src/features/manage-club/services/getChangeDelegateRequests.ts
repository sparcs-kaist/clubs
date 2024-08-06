import apiClb011 from "@sparcs-clubs/interface/api/club/endpoint/apiClb011";
import { useQuery } from "@tanstack/react-query";

import {
  axiosClient,
  defineAxiosMock,
  UnexpectedAPIResponseError,
} from "@sparcs-clubs/web/lib/axios";

import { mockClubDelegateRequest } from "./_mock/mockDelegate";

import type {
  ApiClb011RequestParam,
  ApiClb011ResponseOk,
} from "@sparcs-clubs/interface/api/club/endpoint/apiClb011";

export const useGetChangeDelegateRequests = (
  requestParam: ApiClb011RequestParam,
) =>
  useQuery<ApiClb011ResponseOk, Error>({
    queryKey: [apiClb011.url(requestParam.clubId)],
    queryFn: async (): Promise<ApiClb011ResponseOk> => {
      const { data, status } = await axiosClient.get(
        apiClb011.url(requestParam.clubId),
      );
      switch (status) {
        case 200:
          return apiClb011.responseBodyMap[200].parse(data);
        default:
          throw new UnexpectedAPIResponseError();
      }
    },
  });

defineAxiosMock(mock => {
  mock.onGet(apiClb011.url(1)).reply(() => [200, mockClubDelegateRequest]);
});
