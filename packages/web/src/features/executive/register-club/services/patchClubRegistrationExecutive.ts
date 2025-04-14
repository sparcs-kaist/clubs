import type { ApiReg016RequestParam } from "@clubs/interface/api/registration/endpoint/apiReg016";
import apiReg016 from "@clubs/interface/api/registration/endpoint/apiReg016";

import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

export const patchClubRegistrationExecutive = async (
  requestParam: ApiReg016RequestParam,
) => {
  const { data } = await axiosClientWithAuth.patch(
    apiReg016.url(requestParam.applyId.toString()),
  );

  return apiReg016.responseBodyMap[200].parse(data);
};

defineAxiosMock(mock => {
  mock.onPatch(apiReg016.url("1")).reply(() => [200, {}]);
});
