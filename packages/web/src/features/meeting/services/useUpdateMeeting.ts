import { useMutation } from "@tanstack/react-query";

import apiMee003, {
  ApiMee003RequestBody,
  ApiMee003RequestParam,
  ApiMee003ResponseCreated,
} from "@clubs/interface/api/meeting/apiMee003";

import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

const useUpdateMeeting = () =>
  useMutation<
    ApiMee003ResponseCreated,
    Error,
    { requestParam: ApiMee003RequestParam; body: ApiMee003RequestBody }
  >({
    mutationFn: async ({
      requestParam,
      body,
    }): Promise<ApiMee003ResponseCreated> => {
      const { data } = await axiosClientWithAuth.patch(
        apiMee003.url(requestParam.announcementId),
        body,
      );

      return apiMee003.responseBodyMap[201].parse(data);
    },
  });

export default useUpdateMeeting;

defineAxiosMock(mock => {
  mock.onPatch(apiMee003.url(1)).reply(() => [201, {}]);
});
