import { useQuery } from "@tanstack/react-query";

import apiAct005, {
  ApiAct005RequestQuery,
  ApiAct005ResponseOk,
} from "@clubs/interface/api/activity/endpoint/apiAct005";

import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

import { mockActivityReportData } from "../_mock/activityReportList";

export const newActivityReportListQueryKey = (clubId: number) => [
  apiAct005.url(),
  clubId,
];

const useGetNewActivityReportList = (query: ApiAct005RequestQuery) =>
  useQuery<ApiAct005ResponseOk, Error>({
    queryKey: newActivityReportListQueryKey(query.clubId),
    queryFn: async (): Promise<ApiAct005ResponseOk> => {
      const { data } = await axiosClientWithAuth.get(apiAct005.url(), {
        params: query,
      });

      return apiAct005.responseBodyMap[200].parse(data);
    },
  });

export default useGetNewActivityReportList;

defineAxiosMock(mock => {
  mock.onGet(apiAct005.url()).reply(() => [200, mockActivityReportData]);
});
