import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import React from "react";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import FoldableSection from "@sparcs-clubs/web/common/components/FoldableSection";
import Table from "@sparcs-clubs/web/common/components/Table";
import Tag from "@sparcs-clubs/web/common/components/Tag";
import { ActTypeTagList } from "@sparcs-clubs/web/constants/tableTagList";
import { formatDate } from "@sparcs-clubs/web/utils/Date/formatDate";
import { getTagDetail } from "@sparcs-clubs/web/utils/getTagDetail";

import useGetActivityTerm from "../hooks/useGetActivityTerm";
import useGetPastActivityReportList from "../hooks/useGetPastActivityReportList";
import { PastActivityReportTableData } from "../types/table";

interface PastActivityReportTableProps {
  termId: number;
  clubId: number;
}

const columnHelper = createColumnHelper<PastActivityReportTableData>();
const columns = [
  columnHelper.accessor("name", {
    id: "activity",
    header: "활동명",
    cell: info => info.getValue(),
    size: 20,
  }),
  columnHelper.accessor("activityTypeEnumId", {
    header: "활동 분류",
    cell: info => {
      const { color, text } = getTagDetail(info.getValue(), ActTypeTagList);
      return <Tag color={color}>{text}</Tag>;
    },
    size: 32,
  }),
  columnHelper.accessor(
    row =>
      `${formatDate(row.durations[0].startTerm!)} ~ ${formatDate(row.durations[0].endTerm!)}${row.durations.length > 1 ? ` 외 ${row.durations.length - 1}개` : ""}`,
    {
      id: "date-range",
      header: "활동 기간",
      cell: info => info.getValue(),
      size: 48,
    },
  ),
];

const PastActivityReportTable: React.FC<PastActivityReportTableProps> = ({
  termId,
  clubId,
}) => {
  const router = useRouter();

  const { data: activityTerm } = useGetActivityTerm(clubId, termId);
  const { data, isLoading, isError } = useGetPastActivityReportList(
    termId,
    clubId,
  );

  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
    enableSorting: false,
  });

  return (
    <FoldableSection
      key={activityTerm.id}
      title={`${activityTerm.year}년 ${activityTerm.name}학기 (총 ${data.length}개)`}
    >
      <AsyncBoundary isLoading={isLoading} isError={isError}>
        <Table
          table={table}
          onClick={row => {
            router.push(`/manage-club/activity-report/${row.id}`);
          }}
          count={data.length}
        />
      </AsyncBoundary>
    </FoldableSection>
  );
};

export default PastActivityReportTable;
