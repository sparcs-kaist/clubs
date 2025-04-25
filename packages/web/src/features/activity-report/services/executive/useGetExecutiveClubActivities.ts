import { useQuery } from "@tanstack/react-query";

import apiAct024, {
  ApiAct024RequestQuery,
  ApiAct024ResponseOk,
} from "@clubs/interface/api/activity/endpoint/apiAct024";

import { axiosClientWithAuth } from "@sparcs-clubs/web/lib/axios";

const useGetExecutiveClubActivities = (query: ApiAct024RequestQuery) =>
  useQuery<ApiAct024ResponseOk, Error>({
    queryKey: [apiAct024.url(), query.clubId],
    queryFn: async (): Promise<ApiAct024ResponseOk> => {
      const { data } = await axiosClientWithAuth.get(apiAct024.url(), {
        params: query,
      });

      return data;
    },
  });

export default useGetExecutiveClubActivities;
