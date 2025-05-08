import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import React from "react";

import { ApiReg021ResponseOk } from "@clubs/interface/api/registration/endpoint/apiReg021";

import Table from "@sparcs-clubs/web/common/components/Table";
import Tag from "@sparcs-clubs/web/common/components/Tag";
import {
  getDivisionTagColor,
  RegistrationStatusTagList,
} from "@sparcs-clubs/web/constants/tableTagList";
import { getTagDetail } from "@sparcs-clubs/web/utils/getTagDetail";

interface MyClubTableProps {
  clubProfRegisterList: ApiReg021ResponseOk;
}
const columnHelper = createColumnHelper<ApiReg021ResponseOk["items"][number]>();
const columns = [
  columnHelper.accessor("registrationStatusEnumId", {
    id: "registrationStatusEnumId",
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
  columnHelper.accessor("division.name", {
    id: "division.name",
    header: "분과",
    cell: info => (
      <Tag color={getDivisionTagColor(info.getValue())}>{info.getValue()}</Tag>
    ),
    size: 10,
  }),
  columnHelper.accessor(
    row =>
      row.clubNameKr && row.clubNameKr !== ""
        ? row.clubNameKr
        : row.newClubNameKr,
    {
      id: "clubNameKr",
      header: "동아리",
      cell: info => info.getValue(),
      size: 128,
    },
  ),
  columnHelper.accessor("student.studentNumber", {
    id: "student.studentNumber",
    header: "학번",
    cell: info => info.getValue(),
    size: 128,
  }),
  columnHelper.accessor("student.name", {
    id: "student.name",
    header: "대표자",
    cell: info => info.getValue(),
    size: 128,
  }),
  columnHelper.accessor("student.phoneNumber", {
    id: "student.phoneNumber",
    header: "전화번호",
    cell: info => info.getValue(),
    size: 128,
  }),
  columnHelper.accessor("student.email", {
    id: "student.email",
    header: "이메일",
    cell: info => info.getValue(),
    size: 128,
  }),
];
const MyClubProfTable: React.FC<MyClubTableProps> = ({
  clubProfRegisterList,
}) => {
  const table = useReactTable({
    columns,
    data: clubProfRegisterList.items,
    getCoreRowModel: getCoreRowModel(),
    enableSorting: false,
  });
  const getRowLink = (row: ApiReg021ResponseOk["items"][number]) => ({
    pathname: `/my/register-club/${row.id.toString()}`,
  });

  return (
    <Table
      table={table}
      rowLink={getRowLink}
      emptyMessage="동아리 등록 내역이 없습니다."
    />
  );
};
export default MyClubProfTable;
