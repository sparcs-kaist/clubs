import { useMemo } from "react";

import ProfessorApprovalEnum from "@sparcs-clubs/web/types/professorApproval";

import useGetProfessorCurrentActivityReportList from "../services/useGetProfessorCurrentActivityReportList";
import { ProfessorActivityReportTableData } from "../types/table";
import getProfessorApprovalStatus from "../utils/getProfessorApprovalStatus";

const useGetProfessorActivityReportList = (
  clubId: number,
): {
  data: ProfessorActivityReportTableData[];
  isLoading: boolean;
  isError: boolean;
} => {
  const {
    data: activityReportList,
    isLoading,
    isError,
  } = useGetProfessorCurrentActivityReportList({
    clubId,
  });

  const memoizedData = useMemo(() => {
    if (isLoading || isError || !activityReportList) {
      return [];
    }

    return activityReportList.map(activityReport => ({
      ...activityReport,
      professorApproval:
        getProfessorApprovalStatus({
          professorApprovedAt: activityReport.professorApprovedAt,
        }) ?? ProfessorApprovalEnum.Pending,
    }));
  }, [activityReportList, isLoading, isError]);

  return {
    data: memoizedData,
    isLoading,
    isError,
  };
};

export default useGetProfessorActivityReportList;
