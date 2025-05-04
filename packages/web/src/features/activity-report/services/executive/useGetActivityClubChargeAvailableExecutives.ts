import { useQuery } from "@tanstack/react-query";

import apiAct027, {
  ApiAct027RequestQuery,
  ApiAct027ResponseOk,
} from "@clubs/interface/api/activity/endpoint/apiAct027";

import { axiosClientWithAuth } from "@sparcs-clubs/web/lib/axios";

const useGetActivityClubChargeAvailableExecutives = (
  query: ApiAct027RequestQuery,
) =>
  useQuery<ApiAct027ResponseOk, Error>({
    queryKey: [apiAct027.url(), query.clubIds],
    queryFn: async (): Promise<ApiAct027ResponseOk> => {
      const { data } = await axiosClientWithAuth.get(apiAct027.url(), {
        params: query,
      });

      return data;
    },
  });

export default useGetActivityClubChargeAvailableExecutives;
