import { useQuery } from "@tanstack/react-query";

import apiAct022, {
  ApiAct022ResponseOk,
} from "@clubs/interface/api/activity/endpoint/apiAct022";

import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

const useGetActivityParticipants = (activityId: number) =>
  useQuery<ApiAct022ResponseOk, Error>({
    queryKey: [apiAct022.url(activityId), activityId],
    queryFn: async (): Promise<ApiAct022ResponseOk> => {
      const { data } = await axiosClientWithAuth.get(
        apiAct022.url(activityId),
        {},
      );

      return apiAct022.responseBodyMap[200].parse(data);
    },
  });

export default useGetActivityParticipants;

defineAxiosMock(mock => {
  mock.onGet(apiAct022.url(1)).reply(() => [
    200,
    {
      participants: [
        { id: 1, userId: 23521353245, name: "주영미", studentNumber: 20221234 },
        {
          id: 2,
          userId: 234234234234,
          name: "하승종",
          studentNumber: 20223424,
        },
        {
          id: 3,
          userId: 342235235234,
          name: "권혁원",
          studentNumber: 20228344,
        },
      ],
    },
  ]);
});
