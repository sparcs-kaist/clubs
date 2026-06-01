import { useMemo } from "react";

import useHasAdvisor from "@sparcs-clubs/web/features/clubs/hooks/useHasAdvisor";

import useGetNewActivityReportList from "../services/useGetNewActivityReportList";
import { ActivityReportTableData } from "../types/table";
import getProfessorApprovalStatus from "../utils/getProfessorApprovalStatus";

const useGetCurrentActivityReportList = (
  clubId: number,
): {
  data: ActivityReportTableData[];
  isLoading: boolean;
  isError: boolean;
} => {
  const {
    data: activityReportList,
    isLoading: activityReportListLoading,
    isError: activityReportListError,
  } = useGetNewActivityReportList({
    clubId,
  });
  const {
    data: hasProfessor,
    isLoading: hasProfessorLoading,
    isError: hasProfessorError,
  } = useHasAdvisor(clubId.toString());

  const isLoading = activityReportListLoading || hasProfessorLoading;
  const isError = activityReportListError || hasProfessorError;

  const memoizedData = useMemo(() => {
    if (isLoading || isError || !activityReportList) {
      return [];
    }

    return activityReportList.map(activityReport => ({
      ...activityReport,
      hasProfessor,
      professorApproval: getProfessorApprovalStatus({
        hasProfessor,
        professorApprovedAt: activityReport.professorApprovedAt,
      }),
    }));
  }, [activityReportList, isLoading, isError, hasProfessor]);

  return {
    data: memoizedData,
    isLoading,
    isError,
  };
};

export default useGetCurrentActivityReportList;
