import type { ApiAct025RequestBody } from "@clubs/interface/api/activity/endpoint/apiAct025";
import apiAct025 from "@clubs/interface/api/activity/endpoint/apiAct025";

import { axiosClientWithAuth } from "@sparcs-clubs/web/lib/axios";

export const patchActivityChargedExecutive = async (
  requestBody: ApiAct025RequestBody,
) => {
  const { data } = await axiosClientWithAuth.patch(
    apiAct025.url(),
    requestBody,
  );

  return apiAct025.responseBodyMap[200].parse(data);
};
