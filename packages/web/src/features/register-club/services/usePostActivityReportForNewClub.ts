import { useMutation } from "@tanstack/react-query";

import apiAct007, {
  ApiAct007RequestBody,
  ApiAct007ResponseCreated,
} from "@clubs/interface/api/activity/endpoint/apiAct007";

import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

const usePostActivityReportForNewClub = () =>
  useMutation<ApiAct007ResponseCreated, Error, { body: ApiAct007RequestBody }>({
    mutationFn: async ({ body }): Promise<ApiAct007ResponseCreated> => {
      const { data } = await axiosClientWithAuth.post(apiAct007.url(), body);

      return apiAct007.responseBodyMap[201].parse(data);
    },
  });

export default usePostActivityReportForNewClub;

defineAxiosMock(mock => {
  mock.onPost(apiAct007.url()).reply(() => [201, {}]);
});
