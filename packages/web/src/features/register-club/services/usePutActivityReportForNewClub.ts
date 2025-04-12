import { useMutation } from "@tanstack/react-query";
import { z } from "zod";

import apiAct008 from "@clubs/interface/api/activity/endpoint/apiAct008";

import { axiosClientWithAuth } from "@sparcs-clubs/web/lib/axios";

type ISuccessResponseType = z.infer<(typeof apiAct008.responseBodyMap)[200]>;

const usePutActivityReportForNewClub = () =>
  useMutation<
    ISuccessResponseType,
    Error,
    {
      params: z.infer<typeof apiAct008.requestParam>;
      body: z.infer<typeof apiAct008.requestBody>;
    }
  >({
    mutationFn: async ({ params, body }): Promise<ISuccessResponseType> => {
      const { data } = await axiosClientWithAuth.put(
        apiAct008.url(params.activityId),
        body,
      );

      return apiAct008.responseBodyMap[200].parse(data);
    },
  });

export default usePutActivityReportForNewClub;
