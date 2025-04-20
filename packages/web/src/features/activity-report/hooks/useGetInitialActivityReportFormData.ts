import { UserTypeEnum } from "@clubs/interface/common/enum/user.enum";

import { useAuth } from "@sparcs-clubs/web/common/providers/AuthContext";

import { useGetActivityReport } from "../services/useGetActivityReport";
import { ActivityReportFormData } from "../types/form";

const useGetInitialActivityReportFormData = (
  activityId: number,
): {
  data: ActivityReportFormData;
  isLoading: boolean;
  isError: boolean;
} => {
  const { profile } = useAuth();
  const {
    data: activityReport,
    isLoading,
    isError,
  } = useGetActivityReport(profile?.type ?? "", activityId);

  if (profile?.type !== UserTypeEnum.Undergraduate) {
    return {
      data: {} as ActivityReportFormData,
      isLoading: false,
      isError: true,
    };
  }

  if (isLoading || isError || !activityReport) {
    return {
      data: {} as ActivityReportFormData,
      isLoading,
      isError,
    };
  }

  return {
    data: {
      ...activityReport,
      evidenceFiles: activityReport.evidenceFiles.map(file => ({
        id: file.fileId,
        name: file.name,
        url: file.url,
      })),
      participants: activityReport.participants.map(participant => ({
        id: participant.studentId,
        name: participant.name,
        studentNumber: participant.studentNumber.toString(),
      })),
    },
    isLoading,
    isError,
  };
};

export default useGetInitialActivityReportFormData;
