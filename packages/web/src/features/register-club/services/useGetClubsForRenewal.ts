import { useQuery } from "@tanstack/react-query";

import apiReg002, {
  ApiReg002ResponseOk,
} from "@clubs/interface/api/registration/endpoint/apiReg002";

import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

import { MockRegistrationAvailableClubList } from "./_mocks/RegistrationAvailableClubList";

const useGetClubsForRenewal = () =>
  useQuery<ApiReg002ResponseOk, Error>({
    queryKey: [apiReg002.url()],
    queryFn: async (): Promise<ApiReg002ResponseOk> => {
      const { data } = await axiosClientWithAuth.get(apiReg002.url(), {});

      return data;
    },
  });

export default useGetClubsForRenewal;

defineAxiosMock(mock => {
  mock
    .onGet(apiReg002.url())
    .reply(() => [200, { clubs: MockRegistrationAvailableClubList }]);
});
