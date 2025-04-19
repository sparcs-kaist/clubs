import { useQuery } from "@tanstack/react-query";

import apiAct006, {
  ApiAct006RequestQuery,
  ApiAct006ResponseOk,
} from "@clubs/interface/api/activity/endpoint/apiAct006";

import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

import { mockActivityReportData } from "../_mock/activityReportList";

export const pastActivityReportListQueryKey = (
  activityTermId: number,
  clubId: number,
) => [apiAct006.url(activityTermId), clubId];

const useGetTermActivityReportList = (
  activityTermId: number,
  query: ApiAct006RequestQuery,
) =>
  useQuery<ApiAct006ResponseOk, Error>({
    queryKey: pastActivityReportListQueryKey(activityTermId, query.clubId),
    queryFn: async (): Promise<ApiAct006ResponseOk> => {
      const { data } = await axiosClientWithAuth.get(
        apiAct006.url(activityTermId),
        {
          params: query,
        },
      );

      return apiAct006.responseBodyMap[200].parse(data);
    },
  });

export default useGetTermActivityReportList;

const baseUrl = "/student/activities/activity-terms/activity-term/";

defineAxiosMock(mock => {
  mock
    .onGet(new RegExp(`^${baseUrl}\\d+$`))
    .reply(() => [200, { activities: mockActivityReportData }]);
});
