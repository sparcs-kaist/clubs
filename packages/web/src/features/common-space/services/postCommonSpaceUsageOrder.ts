import type {
  ApiCms003Error423,
  ApiCms003RequestBody,
  ApiCms003RequestParam,
  ApiCms003ResponseCreated,
} from "@clubs/interface/api/common-space/endpoint/apiCms003";
import apiCms003 from "@clubs/interface/api/common-space/endpoint/apiCms003";

import { axiosClientWithAuth } from "@sparcs-clubs/web/lib/axios";

const postCommonSpaceUsageOrder = async (
  requestParam: ApiCms003RequestParam,
  requestBody: ApiCms003RequestBody,
): Promise<ApiCms003ResponseCreated | ApiCms003Error423> => {
  const { data, status } = await axiosClientWithAuth.post(
    apiCms003.url(requestParam.spaceId),
    requestBody,
  );

  if (status === 423) {
    return apiCms003.responseErrorMap[423].parse(data);
  }

  return apiCms003.responseBodyMap[201].parse(data);
};

export default postCommonSpaceUsageOrder;
