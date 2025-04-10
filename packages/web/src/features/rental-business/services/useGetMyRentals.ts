import { useQuery } from "@tanstack/react-query";

import type {
  ApiRnt006RequestQuery,
  ApiRnt006ResponseOK,
} from "@sparcs-clubs/interface/api/rental/endpoint/apiRnt006";
import apiRnt006 from "@sparcs-clubs/interface/api/rental/endpoint/apiRnt006";

import { mockupMyRental } from "@sparcs-clubs/web/features/my/services/_mock/mockMyClub";
import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

export const useGetMyRentals = (
  startDate: Date,
  endTerm: Date,
  pageOffset: number,
  itemCount: number,
) => {
  const requestQuery: ApiRnt006RequestQuery = {
    startDate,
    endTerm,
    pageOffset,
    itemCount,
  };

  return useQuery<ApiRnt006ResponseOK, Error>({
    queryKey: [apiRnt006.url(), requestQuery],
    queryFn: async (): Promise<ApiRnt006ResponseOK> => {
      const { data } = await axiosClientWithAuth.get(apiRnt006.url(), {
        params: requestQuery,
      });

      return apiRnt006.responseBodyMap[200].parse(data);
    },
  });
};

defineAxiosMock(mock => {
  mock.onGet(apiRnt006.url()).reply(() => [200, mockupMyRental]);
});
