import { useQuery } from "@tanstack/react-query";

import apiAct010, {
  ApiAct010RequestQuery,
  ApiAct010ResponseOk,
} from "@clubs/interface/api/activity/endpoint/apiAct010";

import { axiosClientWithAuth } from "@sparcs-clubs/web/lib/axios";

export const activityReportParticipantsQueryKey = (clubId: number) => [
  apiAct010.url(),
  clubId,
];

const useGetParticipants = (query: ApiAct010RequestQuery) =>
  useQuery<ApiAct010ResponseOk, Error>({
    queryKey: activityReportParticipantsQueryKey(query.clubId),
    queryFn: async (): Promise<ApiAct010ResponseOk> => {
      const { data } = await axiosClientWithAuth.get(apiAct010.url(), {
        params: query,
      });

      if (data.total === 0 && data.items.length === 0 && data.offset)
        // items = []일 때 isError = true 방지
        return data;
      return apiAct010.responseBodyMap[200].parse(data);
    },
  });

export default useGetParticipants;
