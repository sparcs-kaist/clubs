import { useQuery } from "@tanstack/react-query";

import apiAct010, {
  ApiAct010RequestQuery,
  ApiAct010ResponseOk,
} from "@clubs/interface/api/activity/endpoint/apiAct010";

import { axiosClientWithAuth } from "@sparcs-clubs/web/lib/axios";

export const activityReportParticipantsQueryKey = (
  clubId: number,
  startTerm: Date | null,
  endTerm: Date | null,
) => [apiAct010.url(), clubId, startTerm, endTerm];

interface UseGetParticipantsQuery
  extends Omit<ApiAct010RequestQuery, "startTerm" | "endTerm"> {
  startTerm: Date | null;
  endTerm: Date | null;
}

const useGetParticipants = (query: UseGetParticipantsQuery) =>
  useQuery<ApiAct010ResponseOk, Error>({
    queryKey: activityReportParticipantsQueryKey(
      query.clubId,
      query.startTerm,
      query.endTerm,
    ),
    queryFn: async (): Promise<ApiAct010ResponseOk> => {
      const { data } = await axiosClientWithAuth.get(apiAct010.url(), {
        params: {
          ...query,
          startTerm: query.startTerm,
          endTerm: query.endTerm,
        },
      });

      if (data.total === 0 && data.items.length === 0 && data.offset)
        // items = []일 때 isError = true 방지
        return data;
      return apiAct010.responseBodyMap[200].parse(data);
    },
    enabled: query.startTerm != null && query.endTerm != null,
  });

export default useGetParticipants;
