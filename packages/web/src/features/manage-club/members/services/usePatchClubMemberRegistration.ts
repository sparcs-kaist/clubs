import { useMutation, useQueryClient } from "@tanstack/react-query";

import type {
  ApiReg007RequestBody,
  ApiReg007RequestParam,
  ApiReg007ResponseNoContent,
} from "@clubs/interface/api/registration/endpoint/apiReg007";
import apiReg007 from "@clubs/interface/api/registration/endpoint/apiReg007";
import apiReg008 from "@clubs/interface/api/registration/endpoint/apiReg008";

import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";
import logger from "@sparcs-clubs/web/utils/logger";

const usePatchClubMemberRegistration = () => {
  const queryClient = useQueryClient();

  return useMutation<
    ApiReg007ResponseNoContent,
    Error,
    { requestParam: ApiReg007RequestParam; body: ApiReg007RequestBody }
  >({
    mutationFn: async ({
      requestParam,
      body,
    }): Promise<ApiReg007ResponseNoContent> => {
      const { data } = await axiosClientWithAuth.patch(
        apiReg007.url(requestParam.applyId.toString()),
        body,
      );

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [apiReg008.url(variables.body.clubId.toString())],
      });
    },
    onError: error => {
      logger.error("Mutation error:", error);
    },
  });
};

export default usePatchClubMemberRegistration;

defineAxiosMock(mock => {
  mock
    .onPatch(apiReg007.url("1"), { clubId: 1, applyStatusEnumId: 3 })
    .reply(() => [204, {}]);
});
