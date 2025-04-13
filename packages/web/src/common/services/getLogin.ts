import { Cookies } from "react-cookie";

import apiAut001, {
  ApiAut001ResponseOk,
} from "@clubs/interface/api/auth/endpoint/apiAut001";

import { axiosClient, defineAxiosMock } from "@sparcs-clubs/web/lib/axios";

import mockAccessToken from "./_mock/mockAccessToken";

const getLogin = async (): Promise<ApiAut001ResponseOk> => {
  const currentUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}${window.location.search}${window.location.hash}`;

  const { data } = await axiosClient.get(apiAut001.url(), {
    params: { next: currentUrl },
  });

  return apiAut001.responseBodyMap[200].parse(data);
};

defineAxiosMock(mock => {
  mock.onGet(apiAut001.url()).reply(() => [200, { url: "/" }]);
  const cookies = new Cookies();
  cookies.set("accessToken", mockAccessToken.accessToken);
});
export default getLogin;
