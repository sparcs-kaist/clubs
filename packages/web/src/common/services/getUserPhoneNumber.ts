import { useQuery } from "@tanstack/react-query";

import apiUsr002, {
  ApiUsr002ResponseOk,
} from "@clubs/interface/api/user/endpoint/apiUsr002";

import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

const useUserPhoneNumber = (userId: number | undefined) =>
  useQuery<ApiUsr002ResponseOk, Error>({
    queryKey: [apiUsr002.url(), userId],
    enabled: userId !== undefined,
    queryFn: async ({ signal }): Promise<ApiUsr002ResponseOk> => {
      const { data } = await axiosClientWithAuth.get(apiUsr002.url(), {
        signal,
      });

      return apiUsr002.responseBodyMap[200].parse(data);
    },
  });

export default useUserPhoneNumber;

defineAxiosMock(mock => {
  mock
    .onGet(apiUsr002.url())
    .reply(() => [200, { phoneNumber: "010-0000-0000" }]);
});
