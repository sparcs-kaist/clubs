import { useMutation, useQueryClient } from "@tanstack/react-query";

import { UserTypeEnum } from "@clubs/interface/common/enum/user.enum";

import { activityReportDetailQueryKey } from "../services/useGetActivityReport";
import usePostProfessorApproveActivityReport from "../services/useProfessorApproveActivityReport";

const useProfessorApproveSingleActivityReport = () => {
  const queryClient = useQueryClient();
  const { mutateAsync: approveActivityReport } =
    usePostProfessorApproveActivityReport();

  return useMutation({
    mutationFn: (activityId: number) =>
      approveActivityReport(
        {
          body: {
            activities: [{ id: activityId }],
          },
        },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({
              queryKey: activityReportDetailQueryKey(
                UserTypeEnum.Professor,
                activityId,
              ),
              exact: false,
            });
          },
        },
      ),
  });
};

export default useProfessorApproveSingleActivityReport;
