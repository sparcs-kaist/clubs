import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import React from "react";

import type { ApiAcf003ResponseOk } from "@clubs/interface/api/activity-certificate/endpoint/apiAcf003";

import Table from "@sparcs-clubs/web/common/components/Table";
import Tag from "@sparcs-clubs/web/common/components/Tag";
import { AcfTagList } from "@sparcs-clubs/web/constants/tableTagList";
import { formatDateTime } from "@sparcs-clubs/web/utils/Date/formatDate";
import { getTagDetail } from "@sparcs-clubs/web/utils/getTagDetail";

interface AcfTableProps {
  certificateList: ApiAcf003ResponseOk;
}

const columnHelper = createColumnHelper<ApiAcf003ResponseOk["items"][number]>();

const columns = [
  columnHelper.accessor("statusEnum", {
    id: "status",
    header: "상태",
    cell: info => {
      const { color, text } = getTagDetail(info.getValue(), AcfTagList);
      return <Tag color={color}>{text}</Tag>;
    },
    size: 10,
  }),
  columnHelper.accessor("createdAt", {
    id: "createdAt",
    header: "신청 일시",
    cell: info => formatDateTime(new Date(info.getValue())),
    size: 50,
  }),
  columnHelper.accessor("studentName", {
    id: "studentName",
    header: "동아리",
    cell: info => info.getValue(),
    size: 20,
  }),
  columnHelper.accessor("issuedNumber", {
    id: "issuedNumber",
    header: "발급 매수",
    cell: info => `${info.getValue()}매`,
    size: 20,
  }),
];

const MyActivityCertificateTable: React.FC<AcfTableProps> = ({
  certificateList,
}) => {
  const table = useReactTable({
    columns,
    data: certificateList.items,
    getCoreRowModel: getCoreRowModel(),
    enableSorting: false,
  });

  return <Table table={table} />;
};

export default MyActivityCertificateTable;
