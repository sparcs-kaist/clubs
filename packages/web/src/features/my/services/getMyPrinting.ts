import { useQuery } from "@tanstack/react-query";

import type {
  ApiPrt005RequestQuery,
  ApiPrt005ResponseOk,
} from "@sparcs-clubs/interface/api/promotional-printing/endpoint/apiPrt005";
import apiPrt005 from "@sparcs-clubs/interface/api/promotional-printing/endpoint/apiPrt005";

import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

import { mockupMyPrint } from "./_mock/mockMyClub";

export const useGetMyPrinting = (
  startDate: Date,
  endTerm: Date,
  pageOffset: number,
  itemCount: number,
) => {
  const requestQuery: ApiPrt005RequestQuery = {
    startDate,
    endTerm,
    pageOffset,
    itemCount,
  };

  return useQuery<ApiPrt005ResponseOk, Error>({
    queryKey: [apiPrt005.url(), requestQuery],
    queryFn: async (): Promise<ApiPrt005ResponseOk> => {
      const { data } = await axiosClientWithAuth.get(apiPrt005.url(), {
        params: requestQuery,
      });

      return apiPrt005.responseBodyMap[200].parse(data);
    },
  });
};

defineAxiosMock(mock => {
  mock.onGet(apiPrt005.url()).reply(() => [200, mockupMyPrint]);
});
