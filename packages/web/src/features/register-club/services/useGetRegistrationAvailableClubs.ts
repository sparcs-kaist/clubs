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
    refetchOnMount: "always",
    queryFn: async (): Promise<ApiReg025ResponseOk> => {
      const { data } = await axiosClientWithAuth.get(apiReg025.url(), {});

      return apiReg025.responseBodyMap[200].parse(data);
    },
  });

export default useGetRegistrationAvailableClubs;

defineAxiosMock(mock => {
  mock.onGet(apiReg025.url()).reply(() => [200, { club: null }]);
});
