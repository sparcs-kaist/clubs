import { useQuery } from "@tanstack/react-query";

import apiAct024, {
  ApiAct024RequestQuery,
  ApiAct024ResponseOk,
} from "@clubs/interface/api/activity/endpoint/apiAct024";
import { ActivityStatusEnum } from "@clubs/interface/common/enum/activity.enum";

import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

const useGetExecutiveClubActivities = (query: ApiAct024RequestQuery) =>
  useQuery<ApiAct024ResponseOk, Error>({
    queryKey: [apiAct024.url(), query.clubId, query.activityDurationId],
    queryFn: async (): Promise<ApiAct024ResponseOk> => {
      const { data } = await axiosClientWithAuth.get(apiAct024.url(), {
        params: query,
      });

      return data;
    },
  });

export default useGetExecutiveClubActivities;

export const mockExecutiveClubActivitiesData: ApiAct024ResponseOk = {
  items: [
    {
      activityId: 1,
      updatedAt: new Date("2024-03-01T10:00:00Z"),
      editedAt: new Date("2024-03-02T11:30:00Z"),
      commentedAt: null,
      activityStatusEnum: ActivityStatusEnum.Applied,
      activityName: "신입 회원 모집",
      commentedExecutive: undefined,
      chargedExecutive: undefined,
    },
    {
      activityId: 2,
      updatedAt: new Date("2024-03-05T14:20:00Z"),
      editedAt: new Date("2024-03-06T09:15:00Z"),
      commentedAt: new Date("2024-03-07T15:00:00Z"),
      activityStatusEnum: ActivityStatusEnum.Approved,
      activityName: "봄 소풍 기획",
      commentedExecutive: undefined,
      chargedExecutive: undefined,
    },
    {
      activityId: 3,
      updatedAt: new Date("2024-03-10T08:45:00Z"),
      editedAt: new Date("2024-03-11T12:00:00Z"),
      commentedAt: new Date("2024-03-12T10:30:00Z"),
      activityStatusEnum: ActivityStatusEnum.Committee,
      activityName: "연례 보고서 제출",
      commentedExecutive: undefined,
      chargedExecutive: undefined,
    },
    {
      activityId: 4,
      updatedAt: new Date("2024-03-15T16:00:00Z"),
      editedAt: new Date("2024-03-16T13:20:00Z"),
      commentedAt: new Date("2024-03-17T09:00:00Z"),
      activityStatusEnum: ActivityStatusEnum.Rejected,
      activityName: "여름 워크숍 신청",
      commentedExecutive: undefined,
      chargedExecutive: undefined,
    },
    {
      activityId: 5,
      updatedAt: new Date("2024-03-11"),
      editedAt: new Date("2024-03-11"),
      commentedAt: null,
      activityStatusEnum: ActivityStatusEnum.Applied,
      activityName: "aa",
      commentedExecutive: undefined,
      chargedExecutive: undefined,
    },
  ],
  chargedExecutive: undefined,
};

defineAxiosMock(mock => {
  mock
    .onGet(apiAct024.url())
    .reply(() => [200, mockExecutiveClubActivitiesData]);
});
