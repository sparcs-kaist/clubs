import { useQuery } from "@tanstack/react-query";

import type {
  ApiCms002RequestParam,
  ApiCms002RequestQuery,
  ApiCms002ResponseOK,
} from "@clubs/interface/api/common-space/endpoint/apiCms002";
import apiCms002 from "@clubs/interface/api/common-space/endpoint/apiCms002";

import { axiosClient, defineAxiosMock } from "@sparcs-clubs/web/lib/axios";

import { mockUsageOrders } from "./_mock/mockupCommonSpaceUsageOrders";

const useGetCommonSpaceUsageOrders = (
  requestParam: ApiCms002RequestParam,
  requestQuery: ApiCms002RequestQuery,
) =>
  useQuery<ApiCms002ResponseOK, Error>({
    queryKey: [apiCms002.url(requestParam.spaceId), requestQuery],
    queryFn: async (): Promise<ApiCms002ResponseOK> => {
      const { data } = await axiosClient.get(
        apiCms002.url(requestParam.spaceId),
        { params: requestQuery },
      );

      return apiCms002.responseBodyMap[200].parse(data);
    },
  });

defineAxiosMock(mock => {
  // Base URL for your API
  const baseUrl = apiCms002.url(2); // Assuming this returns something like '/api/resource/1'

  // Use a regular expression to match the URL with any additional params
  mock
    .onGet(new RegExp(`^${baseUrl}(/|$)`))
    .reply(() => [200, mockUsageOrders]);
});

export default useGetCommonSpaceUsageOrders;
