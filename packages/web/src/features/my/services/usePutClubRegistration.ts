import { useMutation } from "@tanstack/react-query";
import { z } from "zod";

import apiReg009, {
  ApiReg009RequestBody,
  ApiReg009RequestParam,
} from "@clubs/interface/api/registration/endpoint/apiReg009";

import { axiosClientWithAuth } from "@sparcs-clubs/web/lib/axios";

type ISuccessResponseType = z.infer<(typeof apiReg009.responseBodyMap)[200]>;

const usePutClubRegistration = () =>
  useMutation<
    ISuccessResponseType,
    Error,
    { requestParam: ApiReg009RequestParam; body: ApiReg009RequestBody }
  >({
    mutationFn: async ({
      requestParam,
      body,
    }): Promise<ISuccessResponseType> => {
      const { data } = await axiosClientWithAuth.put(
        apiReg009.url(requestParam.applyId),
        body,
      );

      return apiReg009.responseBodyMap[200].parse(data);
    },
  });

export default usePutClubRegistration;
