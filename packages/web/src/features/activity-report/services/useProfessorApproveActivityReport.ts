import { useMutation } from "@tanstack/react-query";

import apiAct020, {
  ApiAct020RequestBody,
  ApiAct020ResponseCreated,
} from "@clubs/interface/api/activity/endpoint/apiAct020";

import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

const usePostProfessorApproveActivityReport = () =>
  useMutation<ApiAct020ResponseCreated, Error, { body: ApiAct020RequestBody }>({
    mutationFn: async ({ body }): Promise<ApiAct020ResponseCreated> => {
      const { data } = await axiosClientWithAuth.post(apiAct020.url(), body);

      return apiAct020.responseBodyMap[201].parse(data);
    },
  });

export default usePostProfessorApproveActivityReport;

defineAxiosMock(mock => {
  mock.onPost(apiAct020.url()).reply(() => [201, {}]);
});
