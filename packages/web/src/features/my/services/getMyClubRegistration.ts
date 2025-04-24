import { useQuery } from "@tanstack/react-query";

import type { ApiReg012ResponseOk } from "@clubs/interface/api/registration/endpoint/apiReg012";
import apiReg012 from "@clubs/interface/api/registration/endpoint/apiReg012";

import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

import { mockMyClubRegisterList } from "./_mock/mockMyClubRegisterDetail";

export const useGetMyClubRegistration = () =>
  useQuery<ApiReg012ResponseOk, Error>({
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
