import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { formatDate } from "date-fns";
import { ko } from "date-fns/locale";
import React, { useCallback, useMemo } from "react";

import { ActivityDeadlineEnum } from "@clubs/domain/semester/deadline";

import { ApiSem007ResponseOK } from "@clubs/interface/api/semester/apiSem007";

import TextButton from "@sparcs-clubs/web/common/components/Buttons/TextButton";
import Table from "@sparcs-clubs/web/common/components/Table";

import useDeleteActivityDeadline from "../services/useDeleteActivityDeadline";

type ActivityDeadlineData = ApiSem007ResponseOK["deadlines"][number];

interface ActivityDeadlineTableProps {
  deadlines: ApiSem007ResponseOK["deadlines"];
}

const getDeadlineTypeText = (deadlineEnum: ActivityDeadlineEnum): string => {
  switch (deadlineEnum) {
    case ActivityDeadlineEnum.Writing:
      return "작성";
    case ActivityDeadlineEnum.Late:
      return "지연제출";
    case ActivityDeadlineEnum.Modification:
      return "수정제출";
    case ActivityDeadlineEnum.Exception:
      return "예외";
    default:
      return "알 수 없음";
  }
};

const ActivityDeadlineTable: React.FC<ActivityDeadlineTableProps> = ({
  deadlines,
}) => {
  const { mutate: deleteActivityDeadline } = useDeleteActivityDeadline();

  const sortedDeadlines = useMemo(() => {
    if (!deadlines) return [];
    return [...deadlines].sort(
      (a, b) => new Date(b.endTerm).getTime() - new Date(a.endTerm).getTime(),
    );
  }, [deadlines]);

  const handleDelete = useCallback(
    (deadlineId: number) => {
      deleteActivityDeadline({ deadlineId });
    },
    [deleteActivityDeadline],
  );

  const actionsCellRenderer = (deadlineId: number) => (
    <TextButton text="삭제" onClick={() => handleDelete(deadlineId)} />
  );

  const columnHelper = createColumnHelper<ActivityDeadlineData>();

  const columns = [
    columnHelper.accessor("deadlineEnum", {
      header: "기간유형",
      cell: info => getDeadlineTypeText(info.getValue()),
      size: 100,
      enableSorting: false,
    }),
    columnHelper.accessor("startTerm", {
      header: "시작일",
      cell: info =>
        formatDate(info.getValue(), "yyyy-MM-dd (ccc)", { locale: ko }),
      size: 150,
      enableSorting: false,
    }),
    columnHelper.accessor("endTerm", {
      header: "종료일",
      cell: info =>
        formatDate(info.getValue(), "yyyy-MM-dd (ccc)", { locale: ko }),
      size: 150,
      enableSorting: false,
    }),
    columnHelper.accessor("id", {
      header: "삭제",
      cell: info => actionsCellRenderer(info.getValue()),
      size: 80,
      enableSorting: false,
    }),
  ];

  const table = useReactTable({
    data: sortedDeadlines,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Table
      table={table}
      count={sortedDeadlines.length}
      unit="개"
      emptyMessage="등록된 활동보고서 제출 기한이 없습니다"
    />
  );
};

export default ActivityDeadlineTable;
