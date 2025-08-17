import { useQuery } from "@tanstack/react-query";

import type {
  ApiSem007RequestQuery,
  ApiSem007ResponseOK,
} from "@clubs/interface/api/semester/apiSem007";
import { apiSem007 } from "@clubs/interface/api/semester/apiSem007";

import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

const useGetActivityDeadlines = (query?: ApiSem007RequestQuery) =>
  useQuery<ApiSem007ResponseOK, Error>({
    queryKey: [apiSem007.url(), query?.activityDId],
    queryFn: async (): Promise<ApiSem007ResponseOK> => {
      const { data } = await axiosClientWithAuth.get(apiSem007.url(), {
        params: query,
      });

      return apiSem007.responseBodyMap[200].parse(data);
    },
  });

export default useGetActivityDeadlines;

defineAxiosMock(mock => {
  mock.onGet(apiSem007.url()).reply(() => [
    200,
    {
      deadlines: [
        {
          id: 1,
          semesterId: 15,
          activityDId: 1,
          activityDurationName: "겨울-봄",
          deadlineEnum: 1, // Writing
          startTerm: new Date("2024-08-01"),
          endTerm: new Date("2024-08-31"),
        },
        {
          id: 2,
          semesterId: 15,
          activityDId: 1,
          activityDurationName: "겨울-봄",
          deadlineEnum: 2, // Late
          startTerm: new Date("2024-09-01"),
          endTerm: new Date("2024-09-15"),
        },
        {
          id: 3,
          semesterId: 15,
          activityDId: 1,
          activityDurationName: "겨울-봄",
          deadlineEnum: 3, // Modification
          startTerm: new Date("2024-09-16"),
          endTerm: new Date("2024-09-30"),
        },
        {
          id: 4,
          semesterId: 16,
          activityDId: 2,
          activityDurationName: "여름-가을",
          deadlineEnum: 1, // Writing
          startTerm: new Date("2024-02-01"),
          endTerm: new Date("2024-02-28"),
        },
      ],
    },
  ]);
});
