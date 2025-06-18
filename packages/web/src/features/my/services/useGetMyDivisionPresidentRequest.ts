import { useQuery } from "@tanstack/react-query";

import apiDiv005, {
  ApiDiv005ResponseOk,
} from "@clubs/interface/api/division/endpoint/apiDiv005";

import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

import { mockMyDivisionPresidentRequest } from "./_mock/mockMyDivisionPresidentRequest";

export const useGetMyDivisionPresidentRequest = () =>
  useQuery<ApiDiv005ResponseOk, Error>({
    queryKey: [apiDiv005.url()],
    queryFn: async (): Promise<ApiDiv005ResponseOk> => {
      const { data } = await axiosClientWithAuth.get(apiDiv005.url());

      return apiDiv005.responseBodyMap[200].parse(data);
    },
  });

defineAxiosMock(mock => {
  mock
    .onGet(apiDiv005.url())
    .reply(() => [200, mockMyDivisionPresidentRequest]);
});
