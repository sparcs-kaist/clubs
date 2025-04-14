import { useMutation } from "@tanstack/react-query";

import type {
  ApiFnd014RequestBody,
  ApiFnd014ResponseOk,
} from "@clubs/interface/api/funding/endpoint/apiFnd014";
import apiFnd014 from "@clubs/interface/api/funding/endpoint/apiFnd014";

import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

const usePatchFundingStatus = () =>
  useMutation<ApiFnd014ResponseOk, Error, { body: ApiFnd014RequestBody }>({
    mutationFn: async ({ body }): Promise<ApiFnd014ResponseOk> => {
      const { data } = await axiosClientWithAuth.patch(apiFnd014.url(), body);

      return apiFnd014.responseBodyMap[200].parse(data);
    },
  });

export default usePatchFundingStatus;

defineAxiosMock(mock => {
  mock.onPatch(apiFnd014.url()).reply(() => [200, {}]);
});
