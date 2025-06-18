import { useQuery } from "@tanstack/react-query";

import apiFnd007, {
  ApiFnd007ResponseOk,
} from "@clubs/interface/api/funding/endpoint/apiFnd007";
import { FundingDeadlineEnum } from "@clubs/interface/common/enum/funding.enum";

import { axiosClient, defineAxiosMock } from "@sparcs-clubs/web/lib/axios";

const useGetFundingDeadline = () =>
  useQuery<ApiFnd007ResponseOk, Error>({
    queryKey: [apiFnd007.url()],
    queryFn: async (): Promise<ApiFnd007ResponseOk> => {
      const { data } = await axiosClient.get(apiFnd007.url(), {});

      return data;
    },
  });

export default useGetFundingDeadline;

defineAxiosMock(mock => {
  mock.onGet(apiFnd007.url()).reply(() => [
    200,
    {
      targetDuration: {
        id: 1,
        year: 2023,
        name: "여름가을",
        semester: [{ id: 15 }, { id: 16 }, { id: 17 }],
        activityDurationTypeEnum: [1],
        startTerm: new Date("2024-07-01"),
        endTerm: new Date("2024-12-30"),
      },
      deadline: {
        id: 1,
        deadlineEnum: FundingDeadlineEnum.Modification,
        startDate: new Date("2024-07-01"),
        endTerm: new Date("2024-12-30"),
      },
    },
  ]);
});
