import { useQuery } from "@tanstack/react-query";

import apiClb001, {
  ApiClb001ResponseOK,
} from "@clubs/interface/api/club/endpoint/apiClb001";

import mockupData from "@sparcs-clubs/web/features/clubs/services/_mock/mockupClubData";
import { axiosClient, defineAxiosMock } from "@sparcs-clubs/web/lib/axios";

export const useGetClubsList = () =>
  useQuery<ApiClb001ResponseOK, Error>({
    queryKey: [apiClb001.url()],
    queryFn: async (): Promise<ApiClb001ResponseOK> => {
      const { data } = await axiosClient.get(apiClb001.url(), {});

      // return apiClb001.responseBodyMap[200].parse(data);
      return data;
    },
  });

// Mock response 설정
defineAxiosMock(mock => {
  mock.onGet(apiClb001.url()).reply(() => [200, mockupData]);
});
