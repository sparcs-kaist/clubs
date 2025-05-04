import { useQuery } from "@tanstack/react-query";

import apiMee002, {
  ApiMee002ResponseOk,
} from "@clubs/interface/api/meeting/apiMee002";

import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

import { mockupMeetingDetail } from "./_mock/mockupMeetingDetail";

const useGetMeetingDetail = (id: number) =>
  useQuery<ApiMee002ResponseOk, Error>({
    queryKey: [apiMee002.url(id)],
    queryFn: async (): Promise<ApiMee002ResponseOk> => {
      const { data } = await axiosClientWithAuth.get(apiMee002.url(id), {});

      return apiMee002.responseBodyMap[200].parse(data);
    },
  });

export default useGetMeetingDetail;

defineAxiosMock(mock => {
  mock.onGet(apiMee002.url(1)).reply(() => [200, mockupMeetingDetail]);
});
