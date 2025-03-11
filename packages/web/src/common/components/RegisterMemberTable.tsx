import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import React from "react";

import { ApiReg019ResponseOk } from "@sparcs-clubs/interface/api/registration/endpoint/apiReg019";

import Table from "@sparcs-clubs/web/common/components/Table";
import Tag from "@sparcs-clubs/web/common/components/Tag";
import {
  getTagColorFromClubType,
  getTagColorFromDivision,
  getTagContentFromClubType,
} from "@sparcs-clubs/web/types/clubdetail.types";

interface RegisterMemberTableProps {
  registerMemberList: ApiReg019ResponseOk;
}

const columnHelper = createColumnHelper<ApiReg019ResponseOk["items"][number]>();

const columns = [
  columnHelper.accessor("clubTypeEnumId", {
    id: "type",
    header: "구분",
    cell: info => {
      const tagColor = getTagColorFromClubType(
        info.row.original.clubTypeEnumId,
        info.row.original.isPermanent,
      );
      const tagContents = getTagContentFromClubType(
        info.row.original.clubTypeEnumId,
        info.row.original.isPermanent,
      );

      return <Tag color={tagColor}>{tagContents}</Tag>;
    },
    size: 125,
  }),
  columnHelper.accessor("division.name", {
    id: "division.name",
    header: "분과",
    cell: info => {
      const tagColor = getTagColorFromDivision(`${info.getValue()}`);

      return <Tag color={tagColor}>{info.getValue()}</Tag>;
    },
    size: 120,
  }),
  columnHelper.accessor("clubName", {
    id: "clubName",
    header: "동아리",
    cell: info => info.getValue(),
    size: 291.67,
  }),
  columnHelper.accessor("totalRegistrations", {
    id: "registeredAll",
    header: "신청 (전체 / 정회원)",
    cell: info =>
      `${info.row.original.totalRegistrations}명 / ${info.row.original.regularMemberRegistrations}명`,
    size: 291.67,
  }),
  columnHelper.accessor("totalApprovals", {
    id: "approvedAll",
    header: "승인 (전체 / 정회원)",
    cell: info =>
      `${info.row.original.totalApprovals}명 / ${info.row.original.regularMemberApprovals}명`,
    size: 291.67,
  }),
];

const RegistrationMemberTable: React.FC<RegisterMemberTableProps> = ({
  registerMemberList,
}) => {
  const table = useReactTable({
    columns,
    data: registerMemberList.items,
    getCoreRowModel: getCoreRowModel(),
    enableSorting: false,
  });

  return (
    <Table
      table={table}
      count={registerMemberList.total}
      rowLink={row => `/executive/register-member/${row.clubId}`}
    />
  );
};

export default RegistrationMemberTable;
