import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

import apiNtc001 from "@clubs/interface/api/notice/endpoint/apiNtc001";

import mockupNoticeList from "@sparcs-clubs/web/features/notices/services/_mock/mockupNoticeList";
import { axiosClient, defineAxiosMock } from "@sparcs-clubs/web/lib/axios";

// TODO: This might better work using z.discriminatedUnion
// 예시는 (typeof apiNtc001.responseBodyMap)[200]의 형태인데, 아래가 맞는 것 같아서 질문 남겨둡니다!
// ISuccessResponseType == NoticePagination 입니다!(NTC001의 경우 응답 형식이 1개뿐이기 때문)
type ISuccessResponseType = z.infer<(typeof apiNtc001.responseBodyMap)[200]>;
type IRequestQueryType = z.infer<typeof apiNtc001.requestQuery>;

export const useGetNotice = (pageOffset: number, itemCount: number) => {
  const requestQuery: IRequestQueryType = { pageOffset, itemCount };

  return useQuery<ISuccessResponseType, Error>({
    queryKey: [apiNtc001.url(), requestQuery],
    queryFn: async (): Promise<ISuccessResponseType> => {
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
