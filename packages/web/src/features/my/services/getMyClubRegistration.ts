import { useQuery, type UseQueryOptions } from "@tanstack/react-query";

import type {
  ApiReg012RequestQuery,
  ApiReg012ResponseOk,
} from "@clubs/interface/api/registration/endpoint/apiReg012";
import apiReg012 from "@clubs/interface/api/registration/endpoint/apiReg012";

import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

import { mockMyClubRegisterList } from "./_mock/mockMyClubRegisterDetail";

type MyClubRegistrationOptions = Pick<
  UseQueryOptions<ApiReg012ResponseOk>,
  "refetchOnMount"
> &
  ApiReg012RequestQuery & { viewerId?: number };

export const useGetMyClubRegistration = ({
  semester,
  clubId,
  viewerId,
  ...options
}: MyClubRegistrationOptions = {}) =>
  useQuery<ApiReg012ResponseOk, Error>({
    ...options,
    queryKey:
      semester || clubId !== undefined
        ? [apiReg012.url(), semester, clubId, viewerId]
        : [apiReg012.url()],

    queryFn: async (): Promise<ApiReg012ResponseOk> => {
      const { data, status } = await axiosClientWithAuth.get(apiReg012.url(), {
        params: { semester, clubId },
      });

      if (status === 204) {
        return { registrations: [] };
      }

      return data;
    },
  });

defineAxiosMock(mock => {
  mock.onGet(apiReg012.url()).reply(() => [200, mockMyClubRegisterList]);
});
