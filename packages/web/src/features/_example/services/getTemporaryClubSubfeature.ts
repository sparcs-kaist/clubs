import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

import { apiTmp000 } from "@clubs/interface/api/_example/endpoints/apiTmp000";

import { axiosClient, defineAxiosMock } from "@sparcs-clubs/web/lib/axios";

// TODO: This might better work using z.discriminatedUnion
type ISuccessResponseType =
  | z.infer<(typeof apiTmp000.responseBodyMap)[200]>
  | z.infer<(typeof apiTmp000.responseBodyMap)[201]>;
type IRequestQueryType = z.infer<typeof apiTmp000.requestQuery>;

export const useGetTemporaryClubSubfeature = (
  id: string,
  page: string,
  limit: string,
  additional: string,
) => {
  const requestQuery: IRequestQueryType = { page, limit, additional };

  return useQuery<ISuccessResponseType, Error>({
    queryKey: [apiTmp000.url(id), requestQuery],
    queryFn: async (): Promise<ISuccessResponseType> => {
      const { data, status } = await axiosClient.get(apiTmp000.url(id), {
        params: requestQuery,
      });

      if (status === 204) {
        return apiTmp000.responseBodyMap[204].parse(data);
      }

      return apiTmp000.responseBodyMap[201].parse(data);
    },
  });
};

defineAxiosMock(mock => {
  mock.onGet(apiTmp000.url("1")).reply(() => {
    const dummy: z.infer<(typeof apiTmp000.responseBodyMap)[200]> = {
      page: 1,
      total: 1,
      limit: 10,
      name: "dummy",
      age: 20,
    };

    return [200, dummy];
  });
});
