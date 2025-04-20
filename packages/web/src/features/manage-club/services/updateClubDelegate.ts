import type {
  ApiClb007RequestBody,
  ApiClb007RequestParam,
} from "@clubs/interface/api/club/endpoint/apiClb007";
import apiClb007 from "@clubs/interface/api/club/endpoint/apiClb007";

import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

export const updateClubDelegates = async (
  requestParam: ApiClb007RequestParam,
  requestBody: ApiClb007RequestBody,
) => {
  const { data } = await axiosClientWithAuth.put(
    apiClb007.url(requestParam.clubId),
    requestBody,
  );

  return apiClb007.responseBodyMap[201].parse(data);
};

defineAxiosMock(mock => {
  mock.onPut(apiClb007.url(1)).reply(201, {
    clubId: 1,
    delegates: [1, 2, 3],
  });
});
