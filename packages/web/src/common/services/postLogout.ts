import apiAut003, {
  ApiAut003ResponseOk,
} from "@clubs/interface/api/auth/endpoint/apiAut003";

import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

const postLogout = async (): Promise<ApiAut003ResponseOk> => {
  await axiosClientWithAuth.post(
    apiAut003.url(),
    {},
    { withCredentials: true },
  );

  return apiAut003.responseBodyMap[201];
};

defineAxiosMock(mock => {
  mock.onPost(apiAut003.url()).reply(() => [201, {}]);
});
export default postLogout;
