import { useQuery } from "@tanstack/react-query";

import type { ApiUsr001ResponseOK } from "@clubs/interface/api/user/endpoint/apiUsr001";
import apiUsr001 from "@clubs/interface/api/user/endpoint/apiUsr001";

import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

import mockupUserProfile from "./_mock/mockupUserProfile";

const useGetUserProfile = () =>
  useQuery<ApiUsr001ResponseOK, Error>({
    queryKey: [apiUsr001.url()],
    queryFn: async (): Promise<ApiUsr001ResponseOK> => {
      const { data } = await axiosClientWithAuth.get(apiUsr001.url(), {});

      // return apiUsr001.responseBodyMap[200].parse(data);
      return data;
    },
  });

defineAxiosMock(mock => {
  mock.onGet(apiUsr001.url()).reply(() => [200, mockupUserProfile]);
});

export default useGetUserProfile;
