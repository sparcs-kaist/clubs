import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import React from "react";

import { ApiReg006ResponseOk } from "@sparcs-clubs/interface/api/registration/endpoint/apiReg006";

import Table from "@sparcs-clubs/web/common/components/Table";
import Tag from "@sparcs-clubs/web/common/components/Tag";
import { RegistrationStatusTagList } from "@sparcs-clubs/web/constants/tableTagList";
import {
  getTagColorFromClubType,
  getTagColorFromDivision,
  getTagContentFromClubType,
} from "@sparcs-clubs/web/types/clubdetail.types";
import { getTagDetail } from "@sparcs-clubs/web/utils/getTagDetail";

interface MyMemberTableProps {
  memberRegisterList: ApiReg006ResponseOk;
}

const columnHelper =
  createColumnHelper<ApiReg006ResponseOk["applies"][number]>();

const columns = [
  columnHelper.accessor("applyStatusEnumId", {
    id: "applyStatusEnumId",
    header: "상태",
    cell: info => {
      const { color, text } = getTagDetail(
        info.getValue(),
        RegistrationStatusTagList,
      );
      return <Tag color={color}>{text}</Tag>;
    },
    size: 10,
  }),
  columnHelper.accessor("type", {
    id: "type",
    header: "구분",
    cell: info => (
      <Tag
        color={getTagColorFromClubType(
          info.row.original.type,
          info.row.original.isPermanent,
        )}
      >
        {getTagContentFromClubType(
          info.row.original.type,
          info.row.original.isPermanent,
        )}
      </Tag>
    ),
    size: 10,
  }),
  columnHelper.accessor("divisionName", {
    id: "divisionName",
    header: "분과",
    cell: info => (
      <Tag color={getTagColorFromDivision(info.getValue())}>
        {info.getValue()}
      </Tag>
    ),
    size: 10,
  }),

  columnHelper.accessor("clubNameKr", {
    id: "clubNameKr",
    header: "동아리",
    cell: info => info.getValue(),
    size: 128,
  }),
];

const MyMemberTable: React.FC<MyMemberTableProps> = ({
  memberRegisterList,
}) => {
  const table = useReactTable({
    columns,
    data: memberRegisterList.applies,
    getCoreRowModel: getCoreRowModel(),
    enableSorting: false,
  });
  const getRowLink = (row: ApiReg006ResponseOk["applies"][number]) => ({
    pathname: `/clubs/${row.clubId.toString()}`,
  });
  return (
    <Table
      table={table}
      rowLink={getRowLink}
      emptyMessage="회원 등록 내역이 없습니다."
    />
  );
};

export default MyMemberTable;
