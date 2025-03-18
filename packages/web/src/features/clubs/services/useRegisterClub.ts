import { useMutation, useQueryClient } from "@tanstack/react-query";

import type {
  ApiReg005RequestBody,
  ApiReg005ResponseCreated,
} from "@sparcs-clubs/interface/api/registration/endpoint/apiReg005";
import apiReg005 from "@sparcs-clubs/interface/api/registration/endpoint/apiReg005";
import apiReg006 from "@sparcs-clubs/interface/api/registration/endpoint/apiReg006";
import apiReg026 from "@sparcs-clubs/interface/api/registration/endpoint/apiReg026";

import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

const useRegisterClub = (body: ApiReg005RequestBody) => {
  const queryClient = useQueryClient();

  return useMutation<ApiReg005ResponseCreated, Error>({
    mutationFn: async (): Promise<ApiReg005ResponseCreated> => {
      const { data } = await axiosClientWithAuth.post(apiReg005.url(), body);

      return apiReg005.responseBodyMap[201].parse(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [apiReg006.url()],
      });
      queryClient.invalidateQueries({
        queryKey: [apiReg026.url(body.clubId.toString())],
      });
    },
  });
};

export default useRegisterClub;

defineAxiosMock(mock => {
  mock.onPost(apiReg005.url()).reply(config => {
    const { clubId } = JSON.parse(config.data);

    if (clubId) {
      return [201, { message: "success" }];
    }
    return [400, { message: "no club ID" }];
  });
});
