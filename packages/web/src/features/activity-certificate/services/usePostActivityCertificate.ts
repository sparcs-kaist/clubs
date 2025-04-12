import { useMutation } from "@tanstack/react-query";

import apiAcf001, {
  ApiAcf001RequestBody,
  ApiAcf001ResponseCreated,
} from "@clubs/interface/api/activity-certificate/endpoint/apiAcf001";

import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

const usePostActivityCertificate = () =>
  useMutation<ApiAcf001ResponseCreated, Error, { body: ApiAcf001RequestBody }>({
    mutationFn: async ({ body }): Promise<ApiAcf001ResponseCreated> => {
      const { data } = await axiosClientWithAuth.post(apiAcf001.url(), body);

      return data;
    },
  });

export default usePostActivityCertificate;

defineAxiosMock(mock => {
  mock.onPost(apiAcf001.url()).reply(() => [201, {}]);
});
