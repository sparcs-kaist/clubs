import { useQuery } from "@tanstack/react-query";

import type {
  ApiClb004RequestParam,
  ApiClb004ResponseOK,
} from "@clubs/interface/api/club/endpoint/apiClb004";
import apiClb004 from "@clubs/interface/api/club/endpoint/apiClb004";

import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

import { mockClubDescription } from "./_mock/mockManageClub";

export const useGetClubInfo = (requestParam: ApiClb004RequestParam) =>
  useQuery<ApiClb004ResponseOK, Error>({
    queryKey: [apiClb004.url(requestParam.clubId)],
    queryFn: async (): Promise<ApiClb004ResponseOK> => {
      const { data } = await axiosClientWithAuth.get(
        apiClb004.url(requestParam.clubId),
      );

      // return apiClb004.responseBodyMap[200].parse(data);
      return data;
    },
    enabled: !!requestParam.clubId,
  });

defineAxiosMock(mock => {
  mock.onGet(apiClb004.url(1)).reply(() => [200, mockClubDescription]);
});
