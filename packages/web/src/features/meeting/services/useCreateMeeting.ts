import { useMutation } from "@tanstack/react-query";

import apiMee001, {
  ApiMee001RequestBody,
  ApiMee001ResponseCreated,
} from "@clubs/interface/api/meeting/apiMee001";

import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

const useCreateMeeting = () =>
  useMutation<ApiMee001ResponseCreated, Error, { body: ApiMee001RequestBody }>({
    mutationFn: async ({ body }): Promise<ApiMee001ResponseCreated> => {
      const { data } = await axiosClientWithAuth.post(apiMee001.url(), body);

      return apiMee001.responseBodyMap[201].parse(data);
    },
  });

export default useCreateMeeting;

defineAxiosMock(mock => {
  mock.onPost(apiMee001.url()).reply(() => [201, { id: 1 }]);
});
