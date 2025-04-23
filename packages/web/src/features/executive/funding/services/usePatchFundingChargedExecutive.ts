import { useMutation } from "@tanstack/react-query";

import type {
  ApiFnd015RequestBody,
  ApiFnd015ResponseOk,
} from "@clubs/interface/api/funding/endpoint/apiFnd015";
import apiFnd015 from "@clubs/interface/api/funding/endpoint/apiFnd015";

import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

const usePatchFundingChargedExecutive = () =>
  useMutation<ApiFnd015ResponseOk, Error, { body: ApiFnd015RequestBody }>({
    mutationFn: async ({ body }): Promise<ApiFnd015ResponseOk> => {
      const { data } = await axiosClientWithAuth.patch(apiFnd015.url(), body);

      return apiFnd015.responseBodyMap[200].parse(data);
    },
  });

export default usePatchFundingChargedExecutive;

defineAxiosMock(mock => {
  mock.onPatch(apiFnd015.url()).reply(() => [200, {}]);
});
