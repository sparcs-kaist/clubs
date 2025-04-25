import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import React from "react";

import Table from "@sparcs-clubs/web/common/components/Table";
import getChargedExecutiveContent from "@sparcs-clubs/web/utils/getChargedExecutiveContent";

export interface ChargedChangeClubProps {
  clubId: number;
  clubNameKr: string;
  clubNameEn: string;
  prevExecutiveName: string;
}

const ChargedChangeClubModalTable: React.FC<{
  data: ChargedChangeClubProps[];
  newExecutiveName: string;
}> = ({ data, newExecutiveName }) => {
  const columnHelper = createColumnHelper<ChargedChangeClubProps>();
  const columns = [
    columnHelper.accessor("clubNameKr", {
      header: "동아리",
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

export default ChargedChangeClubModalTable;
