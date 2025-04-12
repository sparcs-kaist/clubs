import { useQuery } from "@tanstack/react-query";

import apiAct019, {
  ApiAct019RequestQuery,
  ApiAct019ResponseOk,
} from "@clubs/interface/api/activity/endpoint/apiAct019";

import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

import { mockActivityReportData } from "../_mock/activityReportList";

export const professorCurrentActivityReportListQueryKey = (clubId: number) => [
  apiAct019.url(),
  clubId,
];

const useProfessorGetCurrentActivityReportList = (
  query: ApiAct019RequestQuery,
) =>
  useQuery<ApiAct019ResponseOk, Error>({
    queryKey: professorCurrentActivityReportListQueryKey(query.clubId),
    queryFn: async (): Promise<ApiAct019ResponseOk> => {
      const { data } = await axiosClientWithAuth.get(apiAct019.url(), {
        params: query,
      });

      // return apiAct019.responseBodyMap[200].parse(data);
      return data;
    },
  });

export default useProfessorGetCurrentActivityReportList;

defineAxiosMock(mock => {
  mock
    .onGet(apiAct019.url())
    .reply(() => [200, mockActivityReportData as ApiAct019ResponseOk]);
});
