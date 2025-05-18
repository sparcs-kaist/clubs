import { useQuery } from "@tanstack/react-query";

import apiAct023, {
  ApiAct023RequestQuery,
  ApiAct023ResponseOk,
} from "@clubs/interface/api/activity/endpoint/apiAct023";
import { ClubTypeEnum } from "@clubs/interface/common/enum/club.enum";

import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

const useGetExecutiveActivities = (query: ApiAct023RequestQuery) =>
  useQuery<ApiAct023ResponseOk, Error>({
    queryKey: [
      apiAct023.url(),
      query.pageOffset,
      query.itemCount,
      query.clubName,
      query.executiveName,
    ],
    queryFn: async (): Promise<ApiAct023ResponseOk> => {
      const { data } = await axiosClientWithAuth.get(apiAct023.url(), {
        params: query,
      });

      return data;
    },
  });

export default useGetExecutiveActivities;

defineAxiosMock(mock => {
  mock.onGet(apiAct023.url()).reply(() => [
    200,
    {
      items: [
        {
          clubId: 1,
          clubTypeEnum: ClubTypeEnum.Regular,
          divisionName: "string",
          clubNameKr: "string",
          clubNameEn: "string",
          pendingActivitiesCount: 1,
          approvedActivitiesCount: 1,
          rejectedActivitiesCount: 1,
          advisor: undefined,
          chargedExecutive: undefined,
        },
      ],
      executiveProgresses: [
        {
          executiveId: 1,
          executiveName: "string",
          chargedClubsAndProgresses: [
            {
              clubId: 1,
              clubTypeEnum: ClubTypeEnum.Regular,
              divisionName: "string",
              clubNameKr: "string",
              clubNameEn: "string",
              pendingActivitiesCount: 1,
              approvedActivitiesCount: 1,
              rejectedActivitiesCount: 1,
            },
          ],
        },
      ],
    },
  ]);
});
