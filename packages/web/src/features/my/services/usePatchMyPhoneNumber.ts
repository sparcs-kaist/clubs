import apiUsr003, {
  ApiUsr003RequestBody,
} from "@clubs/interface/api/user/endpoint/apiUsr003";

import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

const usePatchClubRegistration = async (body: ApiUsr003RequestBody) => {
  const { data } = await axiosClientWithAuth.patch(apiUsr003.url(), body);

  return apiUsr003.responseBodyMap[200].parse(data);
};

export default usePatchClubRegistration;

defineAxiosMock(mock => {
  mock.onPut(apiUsr003.url()).reply(() => [200, {}]);
});
