import { useMutation, useQueryClient } from "@tanstack/react-query";

import apiAct024 from "@clubs/interface/api/activity/endpoint/apiAct024";
import { UserTypeEnum } from "@clubs/interface/common/enum/user.enum";

import usePatchActivityExecutiveSendBack from "../services/patchActivityExecutiveSendBack";
import { activityReportDetailQueryKey } from "../services/useGetActivityReport";

const useExecutiveRejectActivityReport = (
  activityId: number,
  clubId: number,
) => {
  const queryClient = useQueryClient();
  const { mutateAsync: rejectActivityReport } =
    usePatchActivityExecutiveSendBack({ activityId });

  return useMutation({
    mutationFn: (comment: string) =>
      rejectActivityReport(
        { body: { comment } },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({
              queryKey: activityReportDetailQueryKey(
                UserTypeEnum.Executive,
                activityId,
              ),
              exact: false,
            });
            queryClient.invalidateQueries({
              queryKey: ["executiveChargedActivities"],
            });
            queryClient.invalidateQueries({
              queryKey: [apiAct024.url(), clubId],
            });
          },
        },
      ),
  });
};

export default useExecutiveRejectActivityReport;
