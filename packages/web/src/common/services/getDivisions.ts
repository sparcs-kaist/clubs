import { useQuery } from "@tanstack/react-query";

import apiDiv002, {
  ApiDiv002ResponseOk,
} from "@clubs/interface/api/division/endpoint/apiDiv002";

import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

const useGetDivisions = () =>
  useQuery<ApiDiv002ResponseOk, Error>({
    queryKey: [apiDiv002.url()],
    queryFn: async (): Promise<ApiDiv002ResponseOk> => {
      const { data } = await axiosClientWithAuth.get(apiDiv002.url(), {});

      return data;
    },
  });

export default useGetDivisions;

defineAxiosMock(mock => {
  mock.onGet(apiDiv002.url()).reply(() => [200, {}]);
});
