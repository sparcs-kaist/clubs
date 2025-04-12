import { useQuery } from "@tanstack/react-query";

import apiAct018, {
  ApiAct018ResponseOk,
} from "@sparcs-clubs/interface/api/activity/endpoint/apiAct018";
import { ActivityDeadlineEnum } from "@sparcs-clubs/interface/common/enum/activity.enum";

import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

const useGetActivityDeadline = () =>
  useQuery<ApiAct018ResponseOk, Error>({
    queryKey: [apiAct018.url()],
    queryFn: async (): Promise<ApiAct018ResponseOk> => {
      const { data } = await axiosClientWithAuth.get(apiAct018.url(), {});

      return apiAct018.responseBodyMap[200].parse(data);
    },
  });

export default useGetActivityDeadline;

defineAxiosMock(mock => {
  mock.onGet(apiAct018.url()).reply(() => [
    200,
    {
      targetTerm: {
        id: 1,
        year: 2023,
        name: "여름가을",
        startTerm: new Date("2024-07-01"),
        endTerm: new Date("2024-12-30"),
      },
      deadline: {
        activityDeadlineEnum: ActivityDeadlineEnum.Writing,
        duration: {
          startTerm: new Date("2024-08-01"),
          endTerm: new Date("2024-08-31"),
        },
      },
    },
  ]);
});
