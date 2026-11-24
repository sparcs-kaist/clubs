import { useMutation, useQueryClient } from "@tanstack/react-query";

import apiAct020, {
  ApiAct020ResponseCreated,
} from "@clubs/interface/api/activity/endpoint/apiAct020";
import { UserTypeEnum } from "@clubs/interface/common/enum/user.enum";

import { useAuth } from "@sparcs-clubs/web/common/providers/AuthContext";
import { professorPendingApprovalsQueryKey } from "@sparcs-clubs/web/features/landing/services/useProfessorPendingApprovals";
import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

import { activityReportDetailQueryKey } from "./useGetActivityReport";
import { professorCurrentActivityReportListQueryKey } from "./useGetProfessorCurrentActivityReportList";

const usePostProfessorApproveActivityReport = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async ({
      activityIds,
    }: {
      activityIds: number[];
      clubId: number;
    }): Promise<ApiAct020ResponseCreated> => {
      const { data } = await axiosClientWithAuth.post(apiAct020.url(), {
        activities: activityIds.map(id => ({ id })),
      });

      return apiAct020.responseBodyMap[201].parse(data);
    },
    onSuccess: async (_, { activityIds, clubId }) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: professorCurrentActivityReportListQueryKey(clubId),
          exact: true,
        }),
        ...activityIds.map(activityId =>
          queryClient.invalidateQueries({
            queryKey: activityReportDetailQueryKey(
              UserTypeEnum.Professor,
              activityId,
            ),
          }),
        ),
        profile &&
          queryClient.invalidateQueries({
            queryKey: professorPendingApprovalsQueryKey(profile.id),
            exact: true,
          }),
      ]);
    },
  });
};

export default usePostProfessorApproveActivityReport;

defineAxiosMock(mock => {
  mock.onPost(apiAct020.url()).reply(() => [201, {}]);
});
