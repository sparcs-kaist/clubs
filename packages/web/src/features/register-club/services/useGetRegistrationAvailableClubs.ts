import { useQuery } from "@tanstack/react-query";

import apiReg025, {
  ApiReg025ResponseOk,
} from "@clubs/interface/api/registration/endpoint/apiReg025";

import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

const useGetRegistrationAvailableClubs = () =>
  useQuery<ApiReg025ResponseOk, Error>({
    queryKey: [apiReg025.url()],
    queryFn: async (): Promise<ApiReg025ResponseOk> => {
      const { data } = await axiosClientWithAuth.get(apiReg025.url(), {});

      return data;
    },
  });

export default useGetRegistrationAvailableClubs;

defineAxiosMock(mock => {
  mock.onGet(apiReg025.url()).reply(() => [200, {}]);
});
