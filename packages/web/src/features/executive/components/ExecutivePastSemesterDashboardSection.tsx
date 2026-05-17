import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { ISemester } from "@clubs/domain/semester/semester";

import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import FoldableSectionTitle from "@sparcs-clubs/web/common/components/FoldableSectionTitle";
import Table from "@sparcs-clubs/web/common/components/Table";
import { formatDate } from "@sparcs-clubs/web/utils/Date/formatDate";

interface ExecutivePastSemesterDashboardSectionProps {
  title: string;
  emptyMessage: string;
  semesters: ISemester[];
  rowLink: (semester: ISemester) => string;
}

const columnHelper = createColumnHelper<ISemester>();

const columns = [
  columnHelper.accessor(row => `${row.year}년 ${row.name}`, {
    id: "semester",
    header: "학기",
    cell: info => info.getValue(),
    size: 220,
  }),
  columnHelper.accessor(
    row =>
      `${formatDate(new Date(row.startTerm))} ~ ${formatDate(new Date(row.endTerm))}`,
    {
      id: "duration",
      header: "학기 기간",
      cell: info => info.getValue(),
      size: 420,
    },
  ),
];

const ExecutivePastSemesterDashboardSection = ({
  title,
  emptyMessage,
  semesters,
  rowLink,
}: ExecutivePastSemesterDashboardSectionProps) => {
  const table = useReactTable({
    data: semesters,
    columns,
    getCoreRowModel: getCoreRowModel(),
    enableSorting: false,
  });

  return (
    <FoldableSectionTitle title={title}>
      <FlexWrapper direction="column" gap={20}>
        <Table
          table={table}
          minWidth={820}
          emptyMessage={emptyMessage}
          rowLink={row => rowLink(row)}
        />
      </FlexWrapper>
    </FoldableSectionTitle>
  );
};

export default ExecutivePastSemesterDashboardSection;
