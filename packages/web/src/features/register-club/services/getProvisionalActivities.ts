import { useQuery } from "@tanstack/react-query";

import apiAct011, {
  ApiAct011RequestQuery,
  ApiAct011ResponseOk,
} from "@clubs/interface/api/activity/endpoint/apiAct011";

import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

import { activitiesGet } from "./_atomic/actApiList";

const useProvisionalActivities = (
  profile: string,
  requestQuery: ApiAct011RequestQuery,
) =>
  useQuery<ApiAct011ResponseOk, Error>({
    queryKey: [activitiesGet(profile), requestQuery],
    queryFn: async (): Promise<ApiAct011ResponseOk> => {
      const { data } = await axiosClientWithAuth.get(activitiesGet(profile), {
        params: requestQuery,
      });

      return apiAct011.responseBodyMap[200].parse(data);
    },
  });

export default useProvisionalActivities;

defineAxiosMock(mock => {
  mock.onGet(apiAct011.url()).reply(() => [200, { activities: [] }]);
});
