import { useMutation } from "@tanstack/react-query";
import { z } from "zod";

import apiFnd003 from "@clubs/interface/api/funding/endpoint/apiFnd003";

import { axiosClientWithAuth } from "@sparcs-clubs/web/lib/axios";

type ISuccessResponseType = z.infer<(typeof apiFnd003.responseBodyMap)[200]>;

export const usePutFunding = () =>
  useMutation<
    ISuccessResponseType,
    Error,
    { fundingId: number; body: z.infer<typeof apiFnd003.requestBody> }
  >({
    mutationFn: async ({ fundingId, body }): Promise<ISuccessResponseType> => {
      const { data } = await axiosClientWithAuth.put(
        apiFnd003.url(fundingId),
        body,
      );

      return data;
    },
  });
