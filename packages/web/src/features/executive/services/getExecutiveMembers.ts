import { useQuery } from "@tanstack/react-query";

import type { ApiUsr007ResponseOk } from "@clubs/interface/api/user/endpoint/apiUsr007";
import { apiUsr007 } from "@clubs/interface/api/user/endpoint/apiUsr007";

import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

const useGetExecutiveMembers = () =>
  useQuery<ApiUsr007ResponseOk, Error>({
    queryKey: [apiUsr007.url()],
    queryFn: async (): Promise<ApiUsr007ResponseOk> => {
      const { data } = await axiosClientWithAuth.get(apiUsr007.url(), {});

      return data;
    },
  });

export default useGetExecutiveMembers;

defineAxiosMock(mock => {
  mock.onGet(apiUsr007.url()).reply(() => [
    200,
    {
      executives: [
        {
          id: 1,
          userId: 1,
          studentNumber: "201811111",
          name: "홍길동",
          email: "hong@gmail.com",
          phoneNumber: "01012345678",
          startTerm: "2025-03-01",
          endTerm: "2025-06-30",
        },
      ],
    },
  ]);
});
