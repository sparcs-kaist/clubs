import { useMutation } from "@tanstack/react-query";

import apiFnd013, {
  ApiFnd013RequestBody,
  ApiFnd013RequestParam,
  ApiFnd013ResponseCreated,
} from "@clubs/interface/api/funding/endpoint/apiFnd013";

import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

const usePostFundingReview = () =>
  useMutation<
    ApiFnd013ResponseCreated,
    Error,
    { param: ApiFnd013RequestParam; body: ApiFnd013RequestBody }
  >({
    mutationFn: async ({ param, body }): Promise<ApiFnd013ResponseCreated> => {
      const { data } = await axiosClientWithAuth.post(
        apiFnd013.url(param.id),
        body,
      );

      return apiFnd013.responseBodyMap[201].parse(data);
    },
  });

export default usePostFundingReview;

defineAxiosMock(mock => {
  mock.onPost(apiFnd013.url(1)).reply(() => [201, {}]);
});
