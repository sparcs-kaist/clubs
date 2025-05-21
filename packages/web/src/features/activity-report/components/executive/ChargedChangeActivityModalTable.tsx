import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import React from "react";

import Table from "@sparcs-clubs/web/common/components/Table";
import getChargedExecutiveContent from "@sparcs-clubs/web/utils/getChargedExecutiveContent";

export interface ChargedChangeActivityProps {
  activityId: number;
  activityName: string;
  prevExecutiveName: string;
}

const ChargedChangeActivityModalTable: React.FC<{
  data: ChargedChangeActivityProps[];
  newExecutiveName: string;
}> = ({ data, newExecutiveName }) => {
  const columnHelper = createColumnHelper<ChargedChangeActivityProps>();
  const columns = [
    columnHelper.accessor("activityName", {
      header: "활동명",
      cell: info => info.getValue(),
      size: 50,
    }),
    columnHelper.accessor("prevExecutiveName", {
      header: "담당자",
      cell: info =>
        getChargedExecutiveContent(info.getValue(), newExecutiveName),
      size: 50,
    }),
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    enableSorting: false,
  });

  return <Table table={table} minWidth={200} />;
};

export default ChargedChangeActivityModalTable;
