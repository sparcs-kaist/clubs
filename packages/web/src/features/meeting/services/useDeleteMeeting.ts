import { useMutation } from "@tanstack/react-query";

import apiMee004, {
  ApiMee004RequestParam,
  ApiMee004ResponseOk,
} from "@clubs/interface/api/meeting/apiMee004";

import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

const useDeleteMeeting = () =>
  useMutation<ApiMee004ResponseOk, Error, { param: ApiMee004RequestParam }>({
    mutationFn: async ({ param }): Promise<ApiMee004ResponseOk> => {
      await axiosClientWithAuth.delete(apiMee004.url(param.announcementId));

      return apiMee004.responseBodyMap[200];
    },
  });

export default useDeleteMeeting;

defineAxiosMock(mock => {
  mock.onDelete(apiMee004.url(1)).reply(() => [200]);
});
