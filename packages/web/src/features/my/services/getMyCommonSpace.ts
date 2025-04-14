import { useQuery } from "@tanstack/react-query";

import type {
  ApiCms007RequestQuery,
  ApiCms007ResponseOk,
} from "@clubs/interface/api/common-space/endpoint/apiCms007";
import apiCms007 from "@clubs/interface/api/common-space/endpoint/apiCms007";

import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

import { mockupMyCms } from "./_mock/mockMyClub";

export const useGetMyCommonSpace = (
  startDate: Date,
  endTerm: Date,
  pageOffset: number,
  itemCount: number,
) => {
  const requestQuery: ApiCms007RequestQuery = {
    startDate,
    endTerm,
    pageOffset,
    itemCount,
  };

  return useQuery<ApiCms007ResponseOk, Error>({
    queryKey: [apiCms007.url(), requestQuery],
    queryFn: async (): Promise<ApiCms007ResponseOk> => {
      const { data } = await axiosClientWithAuth.get(apiCms007.url(), {
        params: requestQuery,
      });

      return apiCms007.responseBodyMap[200].parse(data);
    },
  });
};

defineAxiosMock(mock => {
  mock.onGet(apiCms007.url()).reply(() => [200, mockupMyCms]);
});
