import { useQuery } from "@tanstack/react-query";

import type {
  ApiRnt001RequestQuery,
  ApiRnt001ResponseOK,
} from "@clubs/interface/api/rental/endpoint/apiRnt001";
import apiRnt001 from "@clubs/interface/api/rental/endpoint/apiRnt001";

import mockupAvailableRental from "@sparcs-clubs/web/features/rental-business/services/_mock/mockAvailableRental";
import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

export const useGetAvailableRentals = (startDate: Date, endTerm: Date) => {
  const requestQuery: ApiRnt001RequestQuery = { startDate, endTerm };

  return useQuery<ApiRnt001ResponseOK, Error>({
    queryKey: [apiRnt001.url(), requestQuery],
    queryFn: async (): Promise<ApiRnt001ResponseOK> => {
      const { data } = await axiosClientWithAuth.get(apiRnt001.url(), {
        params: requestQuery,
      });

      return apiRnt001.responseBodyMap[200].parse(data);
    },
  });
};

defineAxiosMock(mock => {
  mock.onGet(apiRnt001.url()).reply(() => [200, mockupAvailableRental]);
});
