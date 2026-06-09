import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { ApiAct023ResponseOk } from "@clubs/interface/api/activity/endpoint/apiAct023";

import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import FoldableSectionTitle from "@sparcs-clubs/web/common/components/FoldableSectionTitle";
import Table from "@sparcs-clubs/web/common/components/Table";
import formatActivityDurationName from "@sparcs-clubs/web/features/activity-report/utils/formatActivityDurationName";
import { formatDate } from "@sparcs-clubs/web/utils/Date/formatDate";

type ActivityDuration = NonNullable<
  ApiAct023ResponseOk["pastActivityDurations"]
>[number];

interface ExecutivePastActivityReportDashboardSectionProps {
  activityDurations: ActivityDuration[];
}

const columnHelper = createColumnHelper<ActivityDuration>();

const columns = [
  columnHelper.accessor(row => formatActivityDurationName(row), {
    id: "activityDuration",
    header: "활동반기",
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

const ExecutivePastActivityReportDashboardSection = ({
  activityDurations,
}: ExecutivePastActivityReportDashboardSectionProps) => {
  const table = useReactTable({
    data: activityDurations,
    columns,
    getCoreRowModel: getCoreRowModel(),
    enableSorting: false,
  });

  return (
    <FoldableSectionTitle title="과거 활동보고서 대시보드">
      <FlexWrapper direction="column" gap={20}>
        <Table
          table={table}
          minWidth={820}
          emptyMessage="과거 활동보고서 대시보드가 없습니다"
          rowLink={row =>
            `/executive/activity-report/semester/${row.semester.id}`
          }
        />
      </FlexWrapper>
    </FoldableSectionTitle>
  );
};

export default ExecutivePastActivityReportDashboardSection;
