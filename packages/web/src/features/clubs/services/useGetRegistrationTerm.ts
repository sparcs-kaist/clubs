import { useQuery } from "@tanstack/react-query";

import apiReg004, {
  ApiReg004ResponseOK,
} from "@sparcs-clubs/interface/api/registration/endpoint/apiReg004";

import mockupData from "@sparcs-clubs/web/features/clubs/services/_mock/mockupRegisTermData";
import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

export const useGetRegistrationTerm = () =>
  useQuery<ApiReg004ResponseOK, Error>({
    queryKey: [apiReg004.url()],
    queryFn: async (): Promise<ApiReg004ResponseOK> => {
      const { data } = await axiosClientWithAuth.get(apiReg004.url(), {});

      return data;
    },
  });

defineAxiosMock(mock => {
  mock.onGet(apiReg004.url()).reply(() => [200, mockupData]);
});
