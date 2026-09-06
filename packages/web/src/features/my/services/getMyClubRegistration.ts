import { useQuery, type UseQueryOptions } from "@tanstack/react-query";

import type { ApiReg012ResponseOk } from "@clubs/interface/api/registration/endpoint/apiReg012";
import apiReg012 from "@clubs/interface/api/registration/endpoint/apiReg012";

import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

import { mockMyClubRegisterList } from "./_mock/mockMyClubRegisterDetail";

export const useGetMyClubRegistration = (
  options?: Pick<UseQueryOptions<ApiReg012ResponseOk>, "refetchOnMount">,
) =>
  useQuery<ApiReg012ResponseOk, Error>({
    ...options,
    queryKey: [apiReg012.url()],

    queryFn: async (): Promise<ApiReg012ResponseOk> => {
      const { data, status } = await axiosClientWithAuth.get(
        apiReg012.url(),
        {},
      );

      if (status === 204) {
        return { registrations: [] };
      }

      return data;
    },
  });

defineAxiosMock(mock => {
  mock.onGet(apiReg012.url()).reply(() => [200, mockMyClubRegisterList]);
});
