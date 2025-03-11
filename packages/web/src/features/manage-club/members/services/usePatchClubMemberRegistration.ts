import type {
  ApiReg007RequestBody,
  ApiReg007RequestParam,
} from "@sparcs-clubs/interface/api/registration/endpoint/apiReg007";
import apiReg007 from "@sparcs-clubs/interface/api/registration/endpoint/apiReg007";

import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

export const usePatchClubMemberRegistration = async (
  requestParam: ApiReg007RequestParam,
  requestBody: ApiReg007RequestBody,
) => {
  const { data } = await axiosClientWithAuth.patch(
    apiReg007.url(requestParam.applyId.toString()),
    requestBody,
  );

  // return apiReg007.responseBodyMap[204].parse(data);
  return data;
};

defineAxiosMock(mock => {
  mock
    .onPatch(apiReg007.url("1"), { clubId: 1, applyStatusEnumId: 3 })
    .reply(() => [204, {}]);
});
