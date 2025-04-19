import { useQuery } from "@tanstack/react-query";

import apiFnd008, {
  ApiFnd008ResponseOk,
} from "@clubs/interface/api/funding/endpoint/apiFnd008";

import { axiosClientWithAuth } from "@sparcs-clubs/web/lib/axios";

const useGetExecutiveFundings = () =>
  useQuery<ApiFnd008ResponseOk, Error>({
    queryKey: [apiFnd008.url()],
    queryFn: async (): Promise<ApiFnd008ResponseOk> => {
      const { data } = await axiosClientWithAuth.get(apiFnd008.url(), {});

      return data;
    },
  });

export default useGetExecutiveFundings;
