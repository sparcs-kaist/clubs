import { useQuery } from "@tanstack/react-query";

import type {
  ApiReg019RequestQuery,
  ApiReg019ResponseOk,
} from "@sparcs-clubs/interface/api/registration/endpoint/apiReg019";
import apiReg019 from "@sparcs-clubs/interface/api/registration/endpoint/apiReg019";

import mockupRegistrationMember from "@sparcs-clubs/web/features/executive/register-member/_mock/mockupMemberRegistration";
import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

export const useGetMemberRegistration = (requestQuery: ApiReg019RequestQuery) =>
  useQuery<ApiReg019ResponseOk, Error>({
    queryKey: [apiReg019.url(), requestQuery],
    queryFn: async (): Promise<ApiReg019ResponseOk> => {
      const { data } = await axiosClientWithAuth.get(apiReg019.url(), {
        params: requestQuery,
      });

      // return apiReg019.responseBodyMap[200].parse(data);
      return data;
    },
  });

defineAxiosMock(mock => {
  mock
    .onGet(apiReg019.url(), { pageOffset: 1, itemCount: 10 })
    .reply(() => [200, mockupRegistrationMember]);
});
