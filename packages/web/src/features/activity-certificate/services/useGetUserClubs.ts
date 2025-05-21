import { useQuery } from "@tanstack/react-query";

import apiAcf002, {
  ApiAcf002ResponseOk,
} from "@clubs/interface/api/activity-certificate/endpoint/apiAcf002";

import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

import mockupUserClubs from "./_mock/mockupUserClubs";

export const useGetUserClubs = () =>
  useQuery<ApiAcf002ResponseOk, Error>({
    queryKey: [apiAcf002.url()],
    queryFn: async (): Promise<ApiAcf002ResponseOk> => {
      const { data } = await axiosClientWithAuth.get(apiAcf002.url(), {});

      return data;
    },
  });

defineAxiosMock(mock => {
  mock.onGet(apiAcf002.url()).reply(() => [200, mockupUserClubs]);
});
