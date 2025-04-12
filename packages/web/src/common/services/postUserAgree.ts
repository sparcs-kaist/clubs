import apiUsr004, {
  ApiUsr004ResponseCreated,
} from "@clubs/interface/api/user/endpoint/apiUsr004";

import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

const postUserAgree = async (): Promise<ApiUsr004ResponseCreated> => {
  await axiosClientWithAuth.post(apiUsr004.url(), {});

  return apiUsr004.responseBodyMap[201];
};

defineAxiosMock(mock => {
  mock.onPost(apiUsr004.url()).reply(() => [201, {}]);
});
export default postUserAgree;
