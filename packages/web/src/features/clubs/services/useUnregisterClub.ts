import { useMutation, useQueryClient } from "@tanstack/react-query";

import apiReg006 from "@sparcs-clubs/interface/api/registration/endpoint/apiReg006";
import type {
  ApiReg013RequestParam,
  ApiReg013ResponseOk,
} from "@sparcs-clubs/interface/api/registration/endpoint/apiReg013";
import apiReg013 from "@sparcs-clubs/interface/api/registration/endpoint/apiReg013";
import apiReg026 from "@sparcs-clubs/interface/api/registration/endpoint/apiReg026";

import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

const useUnregisterClub = (clubId: number) => {
  const queryClient = useQueryClient();

  return useMutation<
    ApiReg013ResponseOk,
    Error,
    { requestParam: ApiReg013RequestParam }
  >({
    mutationFn: async ({ requestParam }): Promise<ApiReg013ResponseOk> => {
      const { data } = await axiosClientWithAuth.delete(
        apiReg013.url(requestParam.applyId.toString()),
        {},
      );

      return apiReg013.responseBodyMap[200].parse(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [apiReg006.url()],
      });
      queryClient.invalidateQueries({
        queryKey: [apiReg026.url(clubId.toString())],
      });
    },
  });
};

export default useUnregisterClub;

defineAxiosMock(mock => {
  mock.onDelete(apiReg013.url("1")).reply(() => [200]);
});
