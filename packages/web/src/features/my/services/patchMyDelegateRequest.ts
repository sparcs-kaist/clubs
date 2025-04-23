import type {
  ApiClb014RequestBody,
  ApiClb014RequestParam,
} from "@clubs/interface/api/club/endpoint/apiClb014";
import apiClb014 from "@clubs/interface/api/club/endpoint/apiClb014";

import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

export const patchMyDelegateRequest = async (
  requestParam: ApiClb014RequestParam,
  requestBody: ApiClb014RequestBody,
) => {
  const { data } = await axiosClientWithAuth.patch(
    apiClb014.url(requestParam.requestId),
    requestBody,
  );

  return apiClb014.responseBodyMap[201].parse(data);
};

defineAxiosMock(mock => {
  mock.onPatch(apiClb014.url(1)).reply(() => [201, {}]);
});
