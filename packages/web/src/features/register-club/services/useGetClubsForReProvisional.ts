import { useQuery } from "@tanstack/react-query";

import apiReg018, {
  ApiReg018ResponseOk,
} from "@clubs/interface/api/registration/endpoint/apiReg018";

import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

import { MockRegistrationAvailableClubList } from "./_mocks/RegistrationAvailableClubList";

const useGetClubsForReProvisional = () =>
  useQuery<ApiReg018ResponseOk, Error>({
    queryKey: [apiReg018.url()],
    queryFn: async (): Promise<ApiReg018ResponseOk> => {
      const { data } = await axiosClientWithAuth.get(apiReg018.url(), {});

      // return apiReg018.responseBodyMap[200].parse(data);
      return data;
    },
  });

export default useGetClubsForReProvisional;

defineAxiosMock(mock => {
  mock
    .onGet(apiReg018.url())
    .reply(() => [200, { clubs: MockRegistrationAvailableClubList }]);
});
