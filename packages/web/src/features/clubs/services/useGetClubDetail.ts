import { useQuery } from "@tanstack/react-query";

import type { ApiClb002ResponseOK } from "@clubs/interface/api/club/endpoint/apiClb002";
import apiClb002 from "@clubs/interface/api/club/endpoint/apiClb002";

import mockupData from "@sparcs-clubs/web/features/clubs/services/_mock/mockupClubDetail";
import { axiosClient, defineAxiosMock } from "@sparcs-clubs/web/lib/axios";

interface UseGetClubDetailOptions {
  enabled?: boolean;
}

export const useGetClubDetail = (
  clubId: string,
  options: UseGetClubDetailOptions = {},
) =>
  useQuery<ApiClb002ResponseOK, Error>({
    queryKey: [apiClb002.url(clubId)],
    enabled: options.enabled ?? true,
    queryFn: async (): Promise<ApiClb002ResponseOK> => {
      const { data } = await axiosClient.get(apiClb002.url(clubId), {});

      return apiClb002.responseBodyMap[200].parse(data);
    },
  });

defineAxiosMock(mock => {
  mock.onGet(apiClb002.url("1")).reply(() => [200, mockupData]);
});
