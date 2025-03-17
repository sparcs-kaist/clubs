import { useQuery } from "@tanstack/react-query";

import apiReg026, {
  ApiReg026RequestParam,
  ApiReg026ResponseOk,
} from "@sparcs-clubs/interface/api/registration/endpoint/apiReg026";

import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

const useGetMemberRegistrationCount = (param: ApiReg026RequestParam) =>
  useQuery<ApiReg026ResponseOk, Error>({
    queryKey: [apiReg026.url(param.clubId.toString())],
    queryFn: async (): Promise<ApiReg026ResponseOk> => {
      const { data } = await axiosClientWithAuth.get(
        apiReg026.url(param.clubId.toString()),
        {},
      );

      return data;
    },
  });

export default useGetMemberRegistrationCount;

defineAxiosMock(mock => {
  mock.onGet(apiReg026.url("1")).reply(() => [
    200,
    {
      clubId: 112,
      semesterId: 17,
      totalMemberRegistrationCount: 20,
    } as ApiReg026ResponseOk,
  ]);
});
