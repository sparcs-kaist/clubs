import { useQuery } from "@tanstack/react-query";

import apiReg024, {
  ApiReg024RequestQuery,
  ApiReg024ResponseOk,
} from "@clubs/interface/api/registration/endpoint/apiReg024";

import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

export const useGetRegisterClub = (requestQuery: ApiReg024RequestQuery) =>
  useQuery<ApiReg024ResponseOk, Error>({
    queryKey: [apiReg024.url(), requestQuery],
    queryFn: async (): Promise<ApiReg024ResponseOk> => {
      const { data } = await axiosClientWithAuth.get(apiReg024.url(), {
        params: requestQuery,
      });

      if (data.total === 0 && data.items.length === 0 && data.offset) {
        // items = []일 때 isError = true 방지
        return data;
      }

      // return apiReg024.responseBodyMap[200].parse(data);
      return data;
    },
  });

defineAxiosMock(mock => {
  mock.onGet(apiReg024.url()).reply(() => [200, {}]);
});
