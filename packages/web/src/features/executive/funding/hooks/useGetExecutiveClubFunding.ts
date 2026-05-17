import { useQueries } from "@tanstack/react-query";

import { ApiFnd009ResponseOk } from "@clubs/interface/api/funding/endpoint/apiFnd009";
import { ApiSem001ResponseOK } from "@clubs/interface/api/semester/apiSem001";

import useGetSemesters from "@sparcs-clubs/web/common/services/getSemesters";
import useGetFundingDeadline from "@sparcs-clubs/web/features/manage-club/funding/services/useGetFundingDeadline";

import { executiveClubFundingForDurationQueryFn } from "../services/useGetExecutiveClubFundingForDuration";

const useGetExecutiveClubFunding = (
  clubId: number,
): {
  data: {
    semester: ApiSem001ResponseOK["semesters"][number];
    items: ApiFnd009ResponseOk | null;
  }[];
  isLoading: boolean;
  isError: boolean;
} => {
  const {
    data: semestersData,
    isLoading,
    isError,
  } = useGetSemesters({ pageOffset: 1, itemCount: 100 });

  const {
    data: deadline,
    isLoading: isLoadingDeadline,
    isError: isErrorDeadline,
  } = useGetFundingDeadline();

  const pastSemesters = semestersData?.semesters.filter(semester => {
    const targetSemesterId = deadline?.targetDuration.semester.id;
    const targetSemester = semestersData.semesters.find(
      semesterItem => semesterItem.id === targetSemesterId,
    );

    if (!targetSemesterId) return true;
    if (semester.id === targetSemesterId) return false;
    if (!targetSemester) return true;

    return (
      new Date(semester.endTerm).getTime() <=
      new Date(targetSemester.startTerm).getTime()
    );
  });

  const queries = useQueries({
    queries: (pastSemesters ?? []).map(semester => ({
      queryKey: ["getExecutiveClubFunding", clubId, semester.id],
      queryFn: () =>
        executiveClubFundingForDurationQueryFn(Number(clubId), {
          semesterId: semester.id,
        }),
      retry: false,
      enabled: !!semestersData,
    })),
  });

  const successDataList = queries.map(query =>
    query.isSuccess ? query.data : null,
  );

  return {
    data:
      pastSemesters
        ?.map((semester, index) => ({
          semester,
          items: successDataList[index],
        }))
        .filter(data => data.items == null || data.items.fundings.length > 0) ??
      [],
    isLoading:
      isLoading || isLoadingDeadline || queries.some(query => query.isLoading),
    isError:
      isError ||
      isErrorDeadline ||
      (queries.length > 0 && queries.every(query => query.isError)),
  };
};

export default useGetExecutiveClubFunding;
