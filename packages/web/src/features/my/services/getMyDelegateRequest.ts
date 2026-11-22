import { useQuery } from "@tanstack/react-query";

import type { ApiClb013ResponseOk } from "@clubs/interface/api/club/endpoint/apiClb013";
import apiClb013 from "@clubs/interface/api/club/endpoint/apiClb013";

import type { Profile } from "@sparcs-clubs/web/common/providers/AuthContext";
import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

import { mockMyDelegateChange } from "./_mock/mockMyDelegateChange";

export const useGetMyDelegateRequest = (profile: Profile) =>
  useQuery<ApiClb013ResponseOk, Error>({
    queryKey: [apiClb013.url(), profile.id, profile.type, profile.studentId],
    refetchOnMount: "always",
    queryFn: async ({ signal }): Promise<ApiClb013ResponseOk> => {
      const { data } = await axiosClientWithAuth.get(apiClb013.url(), {
        signal,
      });

      return apiClb013.responseBodyMap[200].parse(data);
    },
  });

defineAxiosMock(mock => {
  mock.onGet(apiClb013.url()).reply(() => [200, mockMyDelegateChange]);
});
