import { UserTypeEnum } from "@clubs/interface/common/enum/user.enum";

import { useAuth } from "@sparcs-clubs/web/common/providers/AuthContext";
import { Comment } from "@sparcs-clubs/web/types/comment";

import { useGetActivityReport } from "../services/useGetActivityReport";

const useGetActivityReportComments = (
  activityId: number,
): {
  data: Comment[];
  isLoading: boolean;
  isError: boolean;
} => {
  const { profile } = useAuth();
  const { data, isLoading, isError } = useGetActivityReport(
    profile?.type ?? UserTypeEnum.Undergraduate,
    activityId,
  );

  if (isLoading || isError || !data) {
    return {
      data: [],
      isLoading,
      isError,
    };
  }

  return {
    data: data.comments,
    isLoading,
    isError,
  };
};

export default useGetActivityReportComments;
