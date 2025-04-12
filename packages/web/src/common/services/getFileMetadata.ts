import { useQuery } from "@tanstack/react-query";

import apiFil002, {
  ApiFil002RequestBody,
  ApiFil002ResponseOk,
} from "@clubs/interface/api/file/apiFil002";

import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

const useFileMetadata = (body: ApiFil002RequestBody) =>
  useQuery<ApiFil002ResponseOk, Error>({
    queryKey: ["fileMetadata", body],
    queryFn: async (): Promise<ApiFil002ResponseOk> => {
      const { data } = await axiosClientWithAuth.post(apiFil002.url(), {
        files: body.files,
      });

      return apiFil002.responseBodyMap[200].parse(data);
    },
    enabled: body.files.length > 0,
  });

export default useFileMetadata;

defineAxiosMock(mock => {
  mock.onGet(apiFil002.url()).reply(() => [
    200,
    {
      metadata: [
        {
          name: "sample-file.txt",
          size: 1024,
        },
      ],
    },
  ]);
});
