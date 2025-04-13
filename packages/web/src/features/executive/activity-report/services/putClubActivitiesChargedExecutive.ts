import type { ApiAct026RequestBody } from "@clubs/interface/api/activity/endpoint/apiAct026";
import apiAct026 from "@clubs/interface/api/activity/endpoint/apiAct026";

import { axiosClientWithAuth } from "@sparcs-clubs/web/lib/axios";

export const putClubActivitiesChargedExecutive = async (
  requestBody: ApiAct026RequestBody,
) => {
  const { data } = await axiosClientWithAuth.put(apiAct026.url(), requestBody);

  return apiAct026.responseBodyMap[200].parse(data);
};
