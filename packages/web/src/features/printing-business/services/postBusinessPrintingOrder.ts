import type {
  ApiPrt002RequestBody,
  ApiPrt002RequestParam,
  ApiPrt002ResponseCreated,
} from "@clubs/interface/api/promotional-printing/endpoint/apiPrt002";
import apiPrt002 from "@clubs/interface/api/promotional-printing/endpoint/apiPrt002";

import { axiosClientWithAuth } from "@sparcs-clubs/web/lib/axios";

const postBusinessPrintingOrder = async (
  requestParam: ApiPrt002RequestParam,
  reuestBody: ApiPrt002RequestBody,
): Promise<ApiPrt002ResponseCreated> => {
  const { data } = await axiosClientWithAuth.post(
    apiPrt002.url(requestParam.clubId.toString()),
    reuestBody,
  );

  return apiPrt002.responseBodyMap[201].parse(data);
};

export default postBusinessPrintingOrder;
