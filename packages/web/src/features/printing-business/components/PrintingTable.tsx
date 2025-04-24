import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import React from "react";

import type { ApiPrt001ResponseOk } from "@clubs/interface/api/promotional-printing/endpoint/apiPrt001";

import Table from "@sparcs-clubs/web/common/components/Table";
import Tag from "@sparcs-clubs/web/common/components/Tag";
import { PrtTagList } from "@sparcs-clubs/web/constants/tableTagList";
import { formatDateTime } from "@sparcs-clubs/web/utils/Date/formatDate";
import getPrintSize from "@sparcs-clubs/web/utils/getPrintSize";
import { getTagDetail } from "@sparcs-clubs/web/utils/getTagDetail";

interface PrintingTableProps {
  printingList: ApiPrt001ResponseOk;
}

const columnHelper = createColumnHelper<ApiPrt001ResponseOk["items"][number]>();

const columns = [
  columnHelper.accessor("status", {
    header: "상태",
    cell: info => {
      const { color, text } = getTagDetail(info.getValue(), PrtTagList);
      return <Tag color={color}>{text}</Tag>;
    },
    size: 10,
  }),
  columnHelper.accessor("createdAt", {
    header: "신청 일시",
    cell: info => formatDateTime(info.getValue()),
    size: 24,
  }),
  columnHelper.accessor("studentName", {
    header: "신청자",
    cell: info => info.getValue(),
    size: 18,
  }),
  columnHelper.accessor("desiredPickUpDate", {
    header: "수령 일시",
    cell: info => formatDateTime(info.getValue()),
    size: 24,
  }),
  columnHelper.accessor("orders", {
    header: "인쇄 매수",
    cell: info =>
      info
        .getValue()
        .sort(
          (a, b) =>
            b.promotionalPrintingSizeEnum - a.promotionalPrintingSizeEnum,
        )
        .map(
          order =>
            `${getPrintSize(order.promotionalPrintingSizeEnum)} ${
              order.numberOfPrints
            }매`,
        )
        .join(", "),
    size: 24,
  }),
];

const PrintingTable: React.FC<PrintingTableProps> = ({ printingList }) => {
  const table = useReactTable({
    columns,
    data: printingList.items,
    getCoreRowModel: getCoreRowModel(),
    enableSorting: false,
  });

  return <Table table={table} />;
};

export default PrintingTable;
