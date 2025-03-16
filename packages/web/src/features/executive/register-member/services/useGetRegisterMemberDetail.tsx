import { useQuery } from "@tanstack/react-query";

import type {
  ApiReg020RequestQuery,
  ApiReg020ResponseOk,
} from "@sparcs-clubs/interface/api/registration/endpoint/apiReg020";
import apiReg020 from "@sparcs-clubs/interface/api/registration/endpoint/apiReg020";

import { mockupClubMemberRegister } from "@sparcs-clubs/web/features/executive/register-member/[id]/_mock/mockClubMemberRegister";
import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

export const useGetRegisterMemberDetail = (
  requestQuery: ApiReg020RequestQuery,
) =>
  useQuery<ApiReg020ResponseOk, Error>({
    queryKey: [apiReg020.url(), requestQuery],
    queryFn: async (): Promise<ApiReg020ResponseOk> => {
      const { data } = await axiosClientWithAuth.get(apiReg020.url(), {
        params: requestQuery,
      });

      // return apiReg020.responseBodyMap[200].parse(data); TODO: check this again
      return data;
    },
  });

defineAxiosMock(mock => {
  mock
    .onGet(apiReg020.url(), { clubId: 1, pageOffset: 1, itemCount: 10 })
    .reply(() => [200, mockupClubMemberRegister]);
});
