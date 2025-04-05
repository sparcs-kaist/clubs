import { useQuery } from "@tanstack/react-query";

import type { ApiReg006ResponseOk } from "@sparcs-clubs/interface/api/registration/endpoint/apiReg006";
import apiReg006 from "@sparcs-clubs/interface/api/registration/endpoint/apiReg006";

import { mockMemberRegister } from "@sparcs-clubs/web/features/my/services/_mock/mockMyRegister";
import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

export const useGetMyMemberRegistration = () =>
  useQuery<ApiReg006ResponseOk, Error>({
    queryKey: [apiReg006.url()],
    queryFn: async (): Promise<ApiReg006ResponseOk> => {
      const { data, status } = await axiosClientWithAuth.get(
        apiReg006.url(),
        {},
      );

      if (status === 204) {
        return { applies: [] };
      }

      return apiReg006.responseBodyMap[200].parse(data);
    },
  });

defineAxiosMock(mock => {
  mock.onGet(apiReg006.url()).reply(() => [200, mockMemberRegister]);
});
