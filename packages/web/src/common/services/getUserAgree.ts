import type { ApiUsr005ResponseOk } from "@clubs/interface/api/user/endpoint/apiUsr005";
import apiUsr005 from "@clubs/interface/api/user/endpoint/apiUsr005";

import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

const getUserAgree = async (): Promise<ApiUsr005ResponseOk> => {
  const { data } = await axiosClientWithAuth.get(apiUsr005.url(), {});

  return apiUsr005.responseBodyMap[200].parse(data);
};

export default getUserAgree;

defineAxiosMock(mock => {
  mock.onGet(apiUsr005.url()).reply(() => [200, { status: { isAgree: true } }]);
});
