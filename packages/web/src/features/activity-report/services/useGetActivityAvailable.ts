import { useQuery } from "@tanstack/react-query";

import {
  ActivityStatusEnum,
  ActivityTypeEnum,
} from "@clubs/domain/activity/activity";

import apiAct021, {
  ApiAct021RequestQuery,
  ApiAct021ResponseOk,
} from "@clubs/interface/api/activity/endpoint/apiAct021";

import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

const useGetActivityAvailable = (query: ApiAct021RequestQuery) =>
  useQuery<ApiAct021ResponseOk, Error>({
    queryKey: [apiAct021.url()],
    queryFn: async (): Promise<ApiAct021ResponseOk> => {
      const { data } = await axiosClientWithAuth.get(apiAct021.url(), {
        params: query,
      });

      return apiAct021.responseBodyMap[200].parse(data);
    },
  });

export default useGetActivityAvailable;

defineAxiosMock(mock => {
  mock.onGet(apiAct021.url()).reply(() => [
    200,
    {
      activities: [
        {
          id: 1,
          name: "활동보고서1",
          activityStatusEnum: ActivityStatusEnum.Applied,
          activityTypeEnum: ActivityTypeEnum.matchedExternalActivity,
          club: { id: 1, name: "동아리1" },
          chargedExecutive: { id: 1, name: "이재현" },
          commentedExecutive: { id: 1, name: "이재현" },
          commentedAt: new Date("2024-01-01"),
          editedAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01"),
        },
      ],
    },
  ]);
});
