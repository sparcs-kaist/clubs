import { useMutation } from "@tanstack/react-query";
import { z } from "zod";

import apiAct004, {
  ApiAct004RequestParam,
} from "@clubs/interface/api/activity/endpoint/apiAct004";

import { axiosClientWithAuth } from "@sparcs-clubs/web/lib/axios";

type ISuccessResponseType = z.infer<(typeof apiAct004.responseBodyMap)[200]>;

// TODO: (@dora) need new endpoint instead of ACT004

export const useDeleteActivityReportProvisional = () =>
  useMutation<
    ISuccessResponseType,
    Error,
    { requestParam: ApiAct004RequestParam }
  >({
    mutationFn: async ({ requestParam }): Promise<ISuccessResponseType> => {
      const { data } = await axiosClientWithAuth.delete(
        `${apiAct004.url(requestParam.activityId)}/provisional`,
        {},
      );

      return apiAct004.responseBodyMap[200].parse(data);
    },
  });
