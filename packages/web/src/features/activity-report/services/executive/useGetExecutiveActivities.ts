import { useQuery } from "@tanstack/react-query";

import apiAct023, {
  ApiAct023RequestQuery,
  ApiAct023ResponseOk,
} from "@clubs/interface/api/activity/endpoint/apiAct023";
import { ActivityDurationTypeEnum } from "@clubs/interface/common/enum/activity.enum";
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
      query.activityDurationId,
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
      activityDuration: {
        id: 1,
        semester: { id: 1 },
        activityDurationTypeEnum: ActivityDurationTypeEnum.Regular,
        year: 2026,
        name: "겨울-봄",
        startTerm: new Date("2025-12-20T00:00:00Z"),
        endTerm: new Date("2026-06-19T23:59:00Z"),
      },
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
