import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useMemo } from "react";

import { ApiSem001ResponseOK } from "@clubs/interface/api/semester/apiSem001";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import FoldableSectionTitle from "@sparcs-clubs/web/common/components/FoldableSectionTitle";
import Table from "@sparcs-clubs/web/common/components/Table";
import useGetSemesters from "@sparcs-clubs/web/common/services/getSemesters";
import useGetFundingDeadline from "@sparcs-clubs/web/features/manage-club/funding/services/useGetFundingDeadline";
import { formatDate } from "@sparcs-clubs/web/utils/Date/formatDate";

type Semester = ApiSem001ResponseOK["semesters"][number];

const columnHelper = createColumnHelper<Semester>();

const columns = [
  columnHelper.accessor(row => `${row.year}년 ${row.name}학기`, {
    id: "term",
    header: "학기",
    cell: info => info.getValue(),
    size: 220,
  }),
  columnHelper.accessor(
    row =>
      `${formatDate(new Date(row.startTerm))} ~ ${formatDate(new Date(row.endTerm))}`,
    {
      id: "duration",
      header: "활동 기간",
      cell: info => info.getValue(),
      size: 420,
    },
  ),
];

const ExecutivePastFundingDashboardSection = () => {
  const {
    data: semestersData,
    isLoading: isSemestersLoading,
    isError: isSemestersError,
  } = useGetSemesters({ pageOffset: 1, itemCount: 100 });

  const {
    data: fundingDeadline,
    isLoading: isFundingDeadlineLoading,
    isError: isFundingDeadlineError,
  } = useGetFundingDeadline();

  const pastSemesters = useMemo(() => {
    const targetSemesterId = fundingDeadline?.targetDuration.semester.id;
    const targetSemester = semestersData?.semesters.find(
      semester => semester.id === targetSemesterId,
    );

    return (semestersData?.semesters ?? [])
      .filter(semester => {
        if (!targetSemesterId) return true;
        if (semester.id === targetSemesterId) return false;
        if (!targetSemester) return true;

        return (
          new Date(semester.endTerm).getTime() <=
          new Date(targetSemester.startTerm).getTime()
        );
      })
      .sort(
        (a, b) => new Date(b.endTerm).getTime() - new Date(a.endTerm).getTime(),
      );
  }, [fundingDeadline, semestersData?.semesters]);

  const table = useReactTable({
    data: pastSemesters,
    columns,
    getCoreRowModel: getCoreRowModel(),
    enableSorting: false,
  });

  return (
    <FoldableSectionTitle title="과거 지원금 대시보드">
      <AsyncBoundary
        isLoading={isSemestersLoading || isFundingDeadlineLoading}
        isError={isSemestersError || isFundingDeadlineError}
      >
        <FlexWrapper direction="column" gap={20}>
          <Table
            table={table}
            minWidth={820}
            emptyMessage="과거 지원금 대시보드가 없습니다"
            rowLink={row => `/executive/funding/semester/${row.id}`}
          />
        </FlexWrapper>
      </AsyncBoundary>
    </FoldableSectionTitle>
  );
};

export default ExecutivePastFundingDashboardSection;
