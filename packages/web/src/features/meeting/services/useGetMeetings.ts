import { useQuery } from "@tanstack/react-query";

import apiMee012, {
  ApiMee012RequestQuery,
  ApiMee012ResponseOk,
} from "@clubs/interface/api/meeting/apiMee012";

import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

import { getMeetingEnumFromValue } from "../types/meeting";
import { mockupMeetings } from "./_mock/mockupMeetings";

const useGetMeetings = (query: ApiMee012RequestQuery) =>
  useQuery<ApiMee012ResponseOk, Error>({
    queryKey: [apiMee012.url(), { type: query.meetingEnumId }],
    queryFn: async (): Promise<ApiMee012ResponseOk> => {
      const { data } = await axiosClientWithAuth.get(apiMee012.url(), {
        params: query,
      });

      return apiMee012.responseBodyMap[200].parse(data);
    },
  });

export default useGetMeetings;

defineAxiosMock(mock => {
  mock.onGet(apiMee012.url()).reply(({ params }) => {
    const meetingEnumId = params.meetingEnumId
      ? getMeetingEnumFromValue(params.meetingEnumId.toString())
      : undefined;

    return [200, mockupMeetings(meetingEnumId)];
  });
});
