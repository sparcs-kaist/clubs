import type { ApiReg010RequestParam } from "@clubs/interface/api/registration/endpoint/apiReg010";
import apiReg010 from "@clubs/interface/api/registration/endpoint/apiReg010";

import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

export const deleteMyClubRegistration = async (
  requestParam: ApiReg010RequestParam,
) => {
  const { data } = await axiosClientWithAuth.delete(
    apiReg010.url(requestParam.applyId),
  );

  return apiReg010.responseBodyMap[200].parse(data);
};

defineAxiosMock(mock => {
  mock.onDelete(apiReg010.url(1)).reply(() => [200, {}]);
});
