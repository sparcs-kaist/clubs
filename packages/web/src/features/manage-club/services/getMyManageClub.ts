import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";

import type {
  ApiClb015ResponseNoContent,
  ApiClb015ResponseOk,
} from "@clubs/interface/api/club/endpoint/apiClb015";
import apiClb015 from "@clubs/interface/api/club/endpoint/apiClb015";

import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

export const useGetMyManageClub = () =>
  useQuery<ApiClb015ResponseOk | ApiClb015ResponseNoContent, Error>({
    queryKey: [apiClb015.url()],
    queryFn: async (): Promise<
      ApiClb015ResponseOk | ApiClb015ResponseNoContent
    > => {
      try {
        const { data, status } = await axiosClientWithAuth.get(apiClb015.url());

        if (status === 200) {
          return apiClb015.responseBodyMap[200].parse(data);
        }

        return {};
      } catch (error) {
        if (error instanceof AxiosError && error.response?.status === 404) {
          return {};
        }

        throw error;
      }
    },
    select: data => data || {},
  });

defineAxiosMock(mock => {
  mock.onGet(apiClb015.url()).reply(() => [
    200,
    {
      clubId: 1,
      delegateEnumId: 2,
    },
  ]);
});
