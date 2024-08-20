import React from "react";

import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import Table from "@sparcs-clubs/web/common/components/Table";
import Tag from "@sparcs-clubs/web/common/components/Tag";
import mockupRegistrationMember from "@sparcs-clubs/web/features/executive/_mock/mockMemberRegistration";
import {
  getTagColorFromClubType,
  getTagColorFromDivision,
  getTagContentFromClubType,
} from "@sparcs-clubs/web/types/clubdetail.types";

interface RegisterMemberTableProps {
  registerMemberList: typeof mockupRegistrationMember;
}

const columnHelper =
  createColumnHelper<(typeof mockupRegistrationMember)["items"][number]>();

const columns = [
  columnHelper.accessor("type", {
    id: "type",
    header: "구분",
    cell: info => {
      const tagColor = getTagColorFromClubType(
        info.row.original.type,
        info.row.original.isPermanent,
      );
      const tagContents = getTagContentFromClubType(
        info.row.original.type,
        info.row.original.isPermanent,
      );

      return <Tag color={tagColor}>{tagContents}</Tag>;
    },
    size: 125,
  }),
  columnHelper.accessor("division", {
    id: "division",
    header: "분과",
    cell: info => {
      const tagColor = getTagColorFromDivision(info.getValue());

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
  columnHelper.accessor("registeredAll", {
    id: "registeredAll",
    header: "신청 (전체 / 정회원)",
    cell: info =>
      `${info.row.original.registeredAll}명 / ${info.row.original.registeredRegular}명`,
    size: 291.67,
  }),
  columnHelper.accessor("approvedAll", {
    id: "approvedAll",
    header: "승인 (전체 / 정회원)",
    cell: info =>
      `${info.row.original.approvedAll}명 / ${info.row.original.approvedRegular}명`,
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
      rowLink={row => row.id.toString()}
    />
  );
};

export default RegistrationMemberTable;
