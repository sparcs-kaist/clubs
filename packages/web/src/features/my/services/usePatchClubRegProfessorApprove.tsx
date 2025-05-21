import { useMutation } from "@tanstack/react-query";

import apiReg023, {
  ApiReg023RequestParam,
  ApiReg023ResponseOk,
} from "@clubs/interface/api/registration/endpoint/apiReg023";

import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

const usePatchClubRegProfessorApprove = () =>
  useMutation<ApiReg023ResponseOk, Error, { param: ApiReg023RequestParam }>({
    mutationFn: async ({ param }): Promise<ApiReg023ResponseOk> => {
      const { data } = await axiosClientWithAuth.patch(
        apiReg023.url(param.applyId),
        {},
      );

      return apiReg023.responseBodyMap[200].parse(data);
    },
  });

export default usePatchClubRegProfessorApprove;

defineAxiosMock(mock => {
  mock.onPatch(apiReg023.url(1)).reply(() => [200, {}]);
});
