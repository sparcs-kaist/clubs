import { useMutation } from "@tanstack/react-query";

import apiFil001, {
  ApiFil001RequestBody,
  ApiFil001ResponseCreated,
} from "@clubs/interface/api/file/apiFil001";

import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

const useFileUpload = () =>
  useMutation<ApiFil001ResponseCreated, Error, { body: ApiFil001RequestBody }>({
    mutationFn: async ({ body }): Promise<ApiFil001ResponseCreated> => {
      const { data } = await axiosClientWithAuth.post(apiFil001.url(), body);

      return apiFil001.responseBodyMap[201].parse(data);
    },
  });

export default useFileUpload;

defineAxiosMock(mock => {
  mock.onPost(apiFil001.url()).reply(() => [
    201,
    {
      urls: [
        {
          uploadUrl: "https://example.com/upload",
          fileId: "sample-file-id",
        },
      ],
    },
  ]);
});
