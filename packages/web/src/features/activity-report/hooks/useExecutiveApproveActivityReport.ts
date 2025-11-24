import { useMutation, useQueryClient } from "@tanstack/react-query";

import apiAct024 from "@clubs/interface/api/activity/endpoint/apiAct024";
import { UserTypeEnum } from "@clubs/interface/common/enum/user.enum";

import usePatchActivityExecutive from "../services/patchActivityExecutive";
import { activityReportDetailQueryKey } from "../services/useGetActivityReport";

const useExecutiveApproveActivityReport = (
  activityId: number,
  clubId: number,
) => {
  const queryClient = useQueryClient();
  const { mutateAsync: approveActivityReport } = usePatchActivityExecutive({
    activityId,
  });

  return useMutation({
    mutationFn: () =>
      approveActivityReport(
        { body: {} },
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

export default useExecutiveApproveActivityReport;
