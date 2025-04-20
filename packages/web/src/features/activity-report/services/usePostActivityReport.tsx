import { useMutation } from "@tanstack/react-query";

import apiAct001, {
  ApiAct001RequestBody,
  ApiAct001ResponseCreated,
} from "@clubs/interface/api/activity/endpoint/apiAct001";

import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

const usePostActivityReport = () =>
  useMutation<ApiAct001ResponseCreated, Error, { body: ApiAct001RequestBody }>({
    mutationFn: async ({ body }): Promise<ApiAct001ResponseCreated> => {
      const { data } = await axiosClientWithAuth.post(apiAct001.url(), body);

      return apiAct001.responseBodyMap[201].parse(data);
    },
  });

export default usePostActivityReport;

defineAxiosMock(mock => {
  mock.onPost(apiAct001.url()).reply(() => [201, {}]);
});
