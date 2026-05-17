import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ko } from "date-fns/locale";
import { formatInTimeZone } from "date-fns-tz";
import { useMemo, useState } from "react";

import { ApiSem016ResponseOk } from "@clubs/interface/api/semester/apiSem016";

import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import Table from "@sparcs-clubs/web/common/components/Table";
import TableActionButton, {
  TableActionButtonGroup,
} from "@sparcs-clubs/web/common/components/Table/TableActionButton";
import DeadlineEditModal from "@sparcs-clubs/web/features/executive/components/DeadlineEditModal";
import { fundingDeadlineEnumToString } from "@sparcs-clubs/web/features/manage-club/funding/constants/fundingDeadlineEnumToString";

import useDeleteFundingDeadline from "../services/useDeleteFundingDeadline";
import useUpdateFundingDeadline from "../services/useUpdateFundingDeadline";

interface ExecutiveFundingClubTableProps {
  fundingDeadlines: ApiSem016ResponseOk;
}

const FundingDeadlineTable = ({
  fundingDeadlines,
}: ExecutiveFundingClubTableProps) => {
  const {
    mutate: deleteFundingDeadline,
    isPending: isDeletingFundingDeadline,
  } = useDeleteFundingDeadline();
  const {
    mutate: updateFundingDeadline,
    isPending: isUpdatingFundingDeadline,
  } = useUpdateFundingDeadline();
  const [editingDeadline, setEditingDeadline] = useState<
    ApiSem016ResponseOk["deadlines"][number] | null
  >(null);

  const sortedDeadlines = useMemo(() => {
    if (!fundingDeadlines?.deadlines) return [];
    return [...fundingDeadlines.deadlines].sort(
      (a, b) => b.startTerm.getTime() - a.startTerm.getTime(),
    );
  }, [fundingDeadlines?.deadlines]);

  const handleDeleteFundingDeadline = (id: number) => {
    const deadlineToDelete = sortedDeadlines.find(d => d.id === id);
    if (!deadlineToDelete) return;

    deleteFundingDeadline({
      fundingDeadlineId: deadlineToDelete.id,
    });
  };

  const handleUpdateFundingDeadline = (startTerm: Date, endTerm: Date) => {
    if (!editingDeadline) return;

    updateFundingDeadline(
      {
        fundingDeadlineId: editingDeadline.id,
        body: { startTerm, endTerm },
      },
      { onSuccess: () => setEditingDeadline(null) },
    );
  };

  const actionsCellRenderer = (
    deadline: ApiSem016ResponseOk["deadlines"][number],
  ) => (
    <TableActionButtonGroup>
      <TableActionButton
        variant="edit"
        onClick={() => setEditingDeadline(deadline)}
        disabled={isUpdatingFundingDeadline}
      />
      <TableActionButton
        variant="delete"
        onClick={() => handleDeleteFundingDeadline(deadline.id)}
        disabled={isDeletingFundingDeadline}
      />
    </TableActionButtonGroup>
  );

  const columnHelper =
    createColumnHelper<ApiSem016ResponseOk["deadlines"][number]>();
  const columns = [
    columnHelper.accessor("deadlineEnum", {
      header: "구분",
      cell: info => fundingDeadlineEnumToString(info.getValue()),
      size: 125,
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
      cell: ({ row }) => actionsCellRenderer(row.original),
      size: 160,
    }),
  ];

  const table = useReactTable({
    data: sortedDeadlines,
    columns,
    getCoreRowModel: getCoreRowModel(),
    enableSorting: false,
  });

  return (
    <FlexWrapper direction="column" gap={8}>
      <Table count={sortedDeadlines.length} table={table} />
      <DeadlineEditModal
        isOpen={editingDeadline != null}
        title="지원금 신청 기간 수정"
        startTerm={editingDeadline?.startTerm}
        endTerm={editingDeadline?.endTerm}
        isPending={isUpdatingFundingDeadline}
        onClose={() => setEditingDeadline(null)}
        onSave={handleUpdateFundingDeadline}
      />
    </FlexWrapper>
  );
};

export default FundingDeadlineTable;
