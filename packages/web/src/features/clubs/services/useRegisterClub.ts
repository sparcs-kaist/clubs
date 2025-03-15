import { useMutation } from "@tanstack/react-query";

import type {
  ApiReg005RequestBody,
  ApiReg005ResponseCreated,
} from "@sparcs-clubs/interface/api/registration/endpoint/apiReg005";
import apiReg005 from "@sparcs-clubs/interface/api/registration/endpoint/apiReg005";

import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

const useRegisterClub = () =>
  useMutation<ApiReg005ResponseCreated, Error, { body: ApiReg005RequestBody }>({
    mutationFn: async ({ body }): Promise<ApiReg005ResponseCreated> => {
      const { data } = await axiosClientWithAuth.post(apiReg005.url(), body);

      return apiReg005.responseBodyMap[201].parse(data);
    },
  });

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
