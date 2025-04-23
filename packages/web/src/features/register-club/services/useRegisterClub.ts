import { useMutation } from "@tanstack/react-query";

import apiReg001, {
  ApiReg001RequestBody,
  ApiReg001ResponseCreated,
} from "@clubs/interface/api/registration/endpoint/apiReg001";

import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

const useRegisterClub = () =>
  useMutation<ApiReg001ResponseCreated, Error, { body: ApiReg001RequestBody }>({
    mutationFn: async ({ body }): Promise<ApiReg001ResponseCreated> => {
      const { data } = await axiosClientWithAuth.post(apiReg001.url(), body);

      return apiReg001.responseBodyMap[201].parse(data);
    },
  });

export default useRegisterClub;

defineAxiosMock(mock => {
  mock.onPost(apiReg001.url()).reply(() => [201, {}]);
});
