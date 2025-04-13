import { useQuery } from "@tanstack/react-query";

import apiReg014, {
  ApiReg014RequestQuery,
  ApiReg014ResponseOk,
} from "@clubs/interface/api/registration/endpoint/apiReg014";

import { mockRegisterClub } from "@sparcs-clubs/web/features/executive/register-club/services/_mock/mockRegisterClub";
import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

export const useGetRegisterClub = (requestQuery: ApiReg014RequestQuery) =>
  useQuery<ApiReg014ResponseOk, Error>({
    queryKey: [apiReg014.url(), requestQuery],
    queryFn: async (): Promise<ApiReg014ResponseOk> => {
      const { data } = await axiosClientWithAuth.get(apiReg014.url(), {
        params: requestQuery,
      });

      if (data.total === 0 && data.items.length === 0 && data.offset) {
        // items = []일 때 isError = true 방지
        return data;
      }

      // return apiReg014.responseBodyMap[200].parse(data);
      return data;
    },
  });

defineAxiosMock(mock => {
  mock.onGet(apiReg014.url()).reply(() => [200, mockRegisterClub]);
});
