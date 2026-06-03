import { useQuery } from "@tanstack/react-query";

import apiAct030, {
  ApiAct030ResponseOk,
} from "@clubs/interface/api/activity/endpoint/apiAct030";
import { ActivityDurationTypeEnum } from "@clubs/interface/common/enum/activity.enum";

import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

const useGetProvisionalActivityDuration = () =>
  useQuery<ApiAct030ResponseOk, Error>({
    queryKey: [apiAct030.url()],
    queryFn: async (): Promise<ApiAct030ResponseOk> => {
      const { data } = await axiosClientWithAuth.get(apiAct030.url(), {});

      return apiAct030.responseBodyMap[200].parse(data);
    },
  });

export default useGetProvisionalActivityDuration;

defineAxiosMock(mock => {
  mock.onGet(apiAct030.url()).reply(() => [
    200,
    {
      activityDuration: {
        id: 1,
        semester: { id: 1 },
        activityDurationTypeEnum: ActivityDurationTypeEnum.Registration,
        year: 2025,
        name: "봄 신규등록",
        startTerm: new Date("2024-03-01"),
        endTerm: new Date("2025-03-01"),
      },
    },
  ]);
});
