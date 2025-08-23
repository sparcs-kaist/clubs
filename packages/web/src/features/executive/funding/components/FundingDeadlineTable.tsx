import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { formatDate } from "date-fns";
import { ko } from "date-fns/locale";
import { useMemo } from "react";

import { ApiSem016ResponseOk } from "@clubs/interface/api/semester/apiSem016";

import TextButton from "@sparcs-clubs/web/common/components/Buttons/TextButton";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import Table from "@sparcs-clubs/web/common/components/Table";
import { fundingDeadlineEnumToString } from "@sparcs-clubs/web/features/manage-club/funding/constants/fundingDeadlineEnumToString";

import useDeleteFundingDeadline from "../services/useDeleteFundingDeadline";

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

  const actionsCellRenderer = (id: number) => (
    <TextButton
      text="삭제"
      onClick={() => handleDeleteFundingDeadline(id)}
      disabled={isDeletingFundingDeadline}
    />
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
          ? formatDate(info.getValue(), "yyyy-MM-dd (ccc)", { locale: ko })
          : "-",
      size: 150,
      enableSorting: false,
    }),
    columnHelper.accessor("endTerm", {
      header: "종료일",
      cell: info =>
        info.getValue()
          ? formatDate(info.getValue(), "yyyy-MM-dd (ccc)", { locale: ko })
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
    data: sortedDeadlines,
    columns,
    getCoreRowModel: getCoreRowModel(),
    enableSorting: false,
  });

  return (
    <FlexWrapper direction="column" gap={8}>
      <Table count={sortedDeadlines.length} table={table} />
    </FlexWrapper>
  );
};

export default FundingDeadlineTable;
