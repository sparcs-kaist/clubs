import { useQuery } from "@tanstack/react-query";

import apiAct027, {
  ApiAct027RequestQuery,
  ApiAct027ResponseOk,
} from "@clubs/interface/api/activity/endpoint/apiAct027";

import { axiosClientWithAuth } from "@sparcs-clubs/web/lib/axios";

interface UseGetActivityClubChargeAvailableExecutivesOptions {
  enabled?: boolean;
}

const useGetActivityClubChargeAvailableExecutives = (
  query: ApiAct027RequestQuery,
  options: UseGetActivityClubChargeAvailableExecutivesOptions = {},
) =>
  useQuery<ApiAct027ResponseOk, Error>({
    queryKey: [apiAct027.url(), query.clubIds],
    enabled: options.enabled ?? true,
    queryFn: async (): Promise<ApiAct027ResponseOk> => {
      const { data } = await axiosClientWithAuth.get(apiAct027.url(), {
        params: query,
      });

      return data;
    },
  });

export default useGetActivityClubChargeAvailableExecutives;
