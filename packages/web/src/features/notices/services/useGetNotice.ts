import { useQuery } from "@tanstack/react-query";

import apiNtc001, {
  ApiNtc001RequestQuery,
  ApiNtc001ResponseOK,
} from "@clubs/interface/api/notice/endpoint/apiNtc001";

import mockupNoticeList from "@sparcs-clubs/web/features/notices/services/_mock/mockupNoticeList";
import { axiosClient, defineAxiosMock } from "@sparcs-clubs/web/lib/axios";

export const useGetNotice = (pageOffset: number, itemCount: number) => {
  const requestQuery: ApiNtc001RequestQuery = { pageOffset, itemCount };

  return useQuery<ApiNtc001ResponseOK, Error>({
    queryKey: [apiNtc001.url(), requestQuery],
    queryFn: async (): Promise<ApiNtc001ResponseOK> => {
      const { data } = await axiosClient.get(apiNtc001.url(), {
        params: requestQuery,
      });

      return apiNtc001.responseBodyMap[200].parse(data);
    },
  });
};

defineAxiosMock(mock => {
  mock.onGet(apiNtc001.url()).reply(() => [200, mockupNoticeList]);
});
