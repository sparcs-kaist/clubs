import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import React from "react";

import type { ApiRnt003ResponseOK } from "@clubs/interface/api/rental/endpoint/apiRnt003";

import Table from "@sparcs-clubs/web/common/components/Table";
import Tag from "@sparcs-clubs/web/common/components/Tag";
import { RntTagList } from "@sparcs-clubs/web/constants/tableTagList";
import {
  formatDate,
  formatDateTime,
} from "@sparcs-clubs/web/utils/Date/formatDate";
import { getTagDetail } from "@sparcs-clubs/web/utils/getTagDetail";

interface RentalTableProps {
  rentalList: ApiRnt003ResponseOK;
  withCount?: boolean;
}

const columnHelper = createColumnHelper<ApiRnt003ResponseOK["items"][number]>();

const columns = [
  columnHelper.accessor("statusEnum", {
    id: "status",
    header: "상태",
    cell: info => {
      const { color, text } = getTagDetail(info.getValue(), RntTagList);
      return <Tag color={color}>{text}</Tag>;
    },
    size: 0,
  }),
  columnHelper.accessor("createdAt", {
    id: "createdAt",
    header: "신청 일시",
    cell: info => formatDateTime(info.getValue()),
    size: 28,
  }),
  columnHelper.accessor("studentName", {
    id: "studentName",
    header: "동아리",
    cell: info => info.getValue(),
    size: 10,
  }),
  columnHelper.accessor("desiredStart", {
    id: "desiredStart",
    header: "대여 일자",
    cell: info => formatDate(info.getValue()),
    size: 21,
  }),
  columnHelper.accessor("desiredEnd", {
    id: "desiredEnd",
    header: "반납 일자",
    cell: info => formatDate(info.getValue()),
    size: 21,
  }),
  columnHelper.accessor(
    row =>
      `${row.objects[0].name} ${row.objects[0].number}개 외 ${row.objects.length - 1}항목`,
    {
      id: "rentalObjects",
      header: "대여 물품",
      cell: info => info.getValue(),
      size: 20,
    },
  ),
];

const MyRentalTable: React.FC<RentalTableProps> = ({
  rentalList,
  withCount = false,
}) => {
  const table = useReactTable({
    columns,
    data: rentalList.items,
    getCoreRowModel: getCoreRowModel(),
    enableSorting: false,
  });

  return (
    <Table table={table} count={withCount ? rentalList.total : undefined} />
  );
};

export default MyRentalTable;
