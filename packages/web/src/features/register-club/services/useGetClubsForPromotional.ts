import { useQuery } from "@tanstack/react-query";

import apiReg003, {
  ApiReg003ResponseOk,
} from "@clubs/interface/api/registration/endpoint/apiReg003";

import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

import { MockRegistrationAvailableClubList } from "./_mocks/RegistrationAvailableClubList";

const useGetClubsForPromotional = () =>
  useQuery<ApiReg003ResponseOk, Error>({
    queryKey: [apiReg003.url()],
    queryFn: async (): Promise<ApiReg003ResponseOk> => {
      const { data } = await axiosClientWithAuth.get(apiReg003.url(), {});

      return data;
    },
  });

export default useGetClubsForPromotional;

defineAxiosMock(mock => {
  mock
    .onGet(apiReg003.url())
    .reply(() => [200, { clubs: MockRegistrationAvailableClubList }]);
});
