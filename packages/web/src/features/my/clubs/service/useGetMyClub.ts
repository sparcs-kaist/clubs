import { useQuery } from "@tanstack/react-query";

import type { ApiClb003ResponseOK } from "@clubs/interface/api/club/endpoint/apiClb003";
import apiClb003 from "@clubs/interface/api/club/endpoint/apiClb003";

import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

import mockMyClubList from "./_mock/mockMyClubList";

const useGetMyClub = () =>
  useQuery<ApiClb003ResponseOK, Error>({
    queryKey: [apiClb003.url()],
    queryFn: async (): Promise<ApiClb003ResponseOK> => {
      const { data } = await axiosClientWithAuth.get(apiClb003.url(), {});

      return data;
    },
  });

defineAxiosMock(mock => {
  mock.onGet(apiClb003.url()).reply(() => {
    const dummy: ApiClb003ResponseOK = mockMyClubList;
    return [200, dummy];
  });
});

export default useGetMyClub;
