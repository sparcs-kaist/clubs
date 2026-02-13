import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ko } from "date-fns/locale";
import { formatInTimeZone } from "date-fns-tz";
import { useMemo } from "react";

import { ActivityDurationTypeEnum } from "@clubs/domain/semester/activity-duration";

import { ApiSem012ResponseOK } from "@clubs/interface/api/semester/apiSem012";

import TextButton from "@sparcs-clubs/web/common/components/Buttons/TextButton";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import Table from "@sparcs-clubs/web/common/components/Table";
import useDeleteActivityDuration from "@sparcs-clubs/web/features/executive/services/useDeleteActivityDuration";

const activityDurationTypeEnumToString = (
  value: ActivityDurationTypeEnum,
): string => {
  switch (value) {
    case ActivityDurationTypeEnum.Regular:
      return "정규";
    case ActivityDurationTypeEnum.Registration:
      return "신규등록";
    default:
      return "";
  }
};

export { activityDurationTypeEnumToString };

type ActivityDurationItem = ApiSem012ResponseOK["activityDurations"][number];

interface ActivityDurationTableProps {
  durations: ActivityDurationItem[];
}

const ActivityDurationTable = ({ durations }: ActivityDurationTableProps) => {
  const {
    mutate: deleteActivityDuration,
    isPending: isDeletingActivityDuration,
  } = useDeleteActivityDuration();

  const sortedDurations = useMemo(() => {
    if (!durations) return [];
    return [...durations].sort(
      (a, b) =>
        new Date(b.startTerm).getTime() - new Date(a.startTerm).getTime(),
    );
  }, [durations]);

  const handleDelete = (id: number) => {
    deleteActivityDuration({ activityDurationId: id });
  };

  const actionsCellRenderer = (id: number) => (
    <TextButton
      text="삭제"
      onClick={() => handleDelete(id)}
      disabled={isDeletingActivityDuration}
    />
  );

  const columnHelper = createColumnHelper<ActivityDurationItem>();
  const columns = [
    columnHelper.accessor("name", {
      header: "활동반기명",
      cell: info => info.getValue(),
      size: 140,
    }),
    columnHelper.accessor("activityDurationTypeEnum", {
      header: "분류",
      cell: info => activityDurationTypeEnumToString(info.getValue()),
      size: 100,
    }),
    columnHelper.accessor("year", {
      header: "년도",
      cell: info => info.getValue(),
      size: 80,
    }),
    columnHelper.accessor("startTerm", {
      header: "시작일",
      cell: info =>
        info.getValue()
          ? formatInTimeZone(
              info.getValue(),
              "Asia/Seoul",
              "yyyy-MM-dd (ccc)",
              { locale: ko },
            )
          : "-",
      size: 150,
      enableSorting: false,
    }),
    columnHelper.accessor("endTerm", {
      header: "종료일",
      cell: info =>
        info.getValue()
          ? formatInTimeZone(
              info.getValue(),
              "Asia/Seoul",
              "yyyy-MM-dd (ccc)",
              { locale: ko },
            )
          : "-",
      size: 150,
      enableSorting: false,
    }),
    columnHelper.display({
      id: "actions",
      header: "관리",
      cell: ({ row }) => actionsCellRenderer(row.original.id),
      size: 120,
    }),
  ];

  const table = useReactTable({
    data: sortedDurations,
    columns,
    getCoreRowModel: getCoreRowModel(),
    enableSorting: false,
  });

  return (
    <FlexWrapper direction="column" gap={8}>
      <Table count={sortedDurations.length} table={table} />
    </FlexWrapper>
  );
};

export default ActivityDurationTable;
