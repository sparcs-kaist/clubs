import type { ApiClb012RequestParam } from "@clubs/interface/api/club/endpoint/apiClb012";
import apiClb012 from "@clubs/interface/api/club/endpoint/apiClb012";

import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

export const deleteChangeDelegateRequest = async (
  requestParam: ApiClb012RequestParam,
) => {
  const { data } = await axiosClientWithAuth.delete(
    apiClb012.url(requestParam.clubId),
  );

  return apiClb012.responseBodyMap[201].parse(data);
};

defineAxiosMock(mock => {
  mock.onDelete(apiClb012.url(1)).reply(() => [201, {}]);
});
