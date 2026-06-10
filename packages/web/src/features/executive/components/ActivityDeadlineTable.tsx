import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ko } from "date-fns/locale";
import { formatInTimeZone } from "date-fns-tz";
import React, { useCallback, useMemo, useState } from "react";

import { ApiSem007ResponseOK } from "@clubs/interface/api/semester/apiSem007";
import { ActivityDeadlineEnum } from "@clubs/interface/common/enum/activity.enum";

import Table from "@sparcs-clubs/web/common/components/Table";
import TableActionButton, {
  TableActionButtonGroup,
} from "@sparcs-clubs/web/common/components/Table/TableActionButton";

import useDeleteActivityDeadline from "../services/useDeleteActivityDeadline";
import useUpdateActivityDeadline from "../services/useUpdateActivityDeadline";
import DeadlineEditModal from "./DeadlineEditModal";

type ActivityDeadlineData = ApiSem007ResponseOK["deadlines"][number];

interface ActivityDeadlineTableProps {
  deadlines: ApiSem007ResponseOK["deadlines"];
}

const getDeadlineTypeText = (deadlineEnum: ActivityDeadlineEnum): string => {
  switch (deadlineEnum) {
    case ActivityDeadlineEnum.Writing:
      return "작성";
    case ActivityDeadlineEnum.Executive:
      return "집행부 검토";
    case ActivityDeadlineEnum.Modification:
      return "수정 제출";
    case ActivityDeadlineEnum.Exception:
      return "이의제기";
    default:
      return "알 수 없음";
  }
};

const ActivityDeadlineTable: React.FC<ActivityDeadlineTableProps> = ({
  deadlines,
}) => {
  const {
    mutate: deleteActivityDeadline,
    isPending: isDeletingActivityDeadline,
  } = useDeleteActivityDeadline();
  const {
    mutate: updateActivityDeadline,
    isPending: isUpdatingActivityDeadline,
  } = useUpdateActivityDeadline();
  const [editingDeadline, setEditingDeadline] =
    useState<ActivityDeadlineData | null>(null);

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

  const handleUpdate = (startTerm: Date, endTerm: Date) => {
    if (!editingDeadline) return;

    updateActivityDeadline(
      {
        deadlineId: editingDeadline.id,
        body: { startTerm, endTerm },
      },
      { onSuccess: () => setEditingDeadline(null) },
    );
  };

  const actionsCellRenderer = (deadline: ActivityDeadlineData) => (
    <TableActionButtonGroup>
      <TableActionButton
        variant="edit"
        onClick={() => setEditingDeadline(deadline)}
        disabled={isUpdatingActivityDeadline}
      />
      <TableActionButton
        variant="delete"
        onClick={() => handleDelete(deadline.id)}
        disabled={isDeletingActivityDeadline}
      />
    </TableActionButtonGroup>
  );

  const columnHelper = createColumnHelper<ActivityDeadlineData>();

  const columns = [
    columnHelper.accessor("deadlineEnum", {
      header: "제출 기간 유형",
      cell: info => getDeadlineTypeText(info.getValue()),
      size: 100,
      enableSorting: false,
    }),
    columnHelper.accessor("startTerm", {
      header: "시작일",
      cell: info =>
        formatInTimeZone(info.getValue(), "Asia/Seoul", "yyyy-MM-dd (ccc)", {
          locale: ko,
        }),
      size: 150,
      enableSorting: false,
    }),
    columnHelper.accessor("endTerm", {
      header: "종료일",
      cell: info =>
        formatInTimeZone(info.getValue(), "Asia/Seoul", "yyyy-MM-dd (ccc)", {
          locale: ko,
        }),
      size: 150,
      enableSorting: false,
    }),
    columnHelper.display({
      id: "actions",
      header: "관리",
      cell: ({ row }) => actionsCellRenderer(row.original),
      size: 160,
      enableSorting: false,
    }),
  ];

  const table = useReactTable({
    data: sortedDeadlines,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
      <Table
        table={table}
        count={sortedDeadlines.length}
        unit="개"
        emptyMessage="등록된 활동보고서 제출 기간이 없습니다"
      />
      <DeadlineEditModal
        isOpen={editingDeadline != null}
        title="활동보고서 제출 기간 수정"
        startTerm={editingDeadline?.startTerm}
        endTerm={editingDeadline?.endTerm}
        isPending={isUpdatingActivityDeadline}
        onClose={() => setEditingDeadline(null)}
        onSave={handleUpdate}
      />
    </>
  );
};

export default ActivityDeadlineTable;
