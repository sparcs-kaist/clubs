import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import React from "react";

import { ApiReg014ResponseOk } from "@clubs/interface/api/registration/endpoint/apiReg014";

import Table from "@sparcs-clubs/web/common/components/Table";
import Tag from "@sparcs-clubs/web/common/components/Tag";
import useGetDivisionType from "@sparcs-clubs/web/common/hooks/useGetDivisionType";
import {
  RegistrationStatusTagList,
  RegistrationTypeTagList,
} from "@sparcs-clubs/web/constants/tableTagList";
import { getTagDetail } from "@sparcs-clubs/web/utils/getTagDetail";

const columnHelper = createColumnHelper<ApiReg014ResponseOk["items"][number]>();

const columns = [
  columnHelper.accessor("registrationStatusEnumId", {
    id: "status",
    header: "상태",
    cell: info => {
      const { color, text } = getTagDetail(
        info.getValue(),
        RegistrationStatusTagList,
      );
      return (
        <Tag color={color} width="50px">
          {text}
        </Tag>
      );
    },
    size: 90,
  }),
  columnHelper.accessor("registrationTypeEnumId", {
    id: "type",
    header: "구분",
    cell: info => {
      const { color, text } = getTagDetail(
        info.getValue(),
        RegistrationTypeTagList,
      );
      return (
        <Tag color={color} width="80px">
          {text}
        </Tag>
      );
    },
    size: 120,
  }),
  columnHelper.accessor("divisionId", {
    id: "division",
    header: "분과",
    cell: info => {
      const { data: divisionData } = useGetDivisionType();
      const { color, text } =
        divisionData?.divisionTagList[info.getValue()] ?? {};
      return (
        <Tag color={color} width="80px">
          {text}
        </Tag>
      );
    },
    size: 120,
  }),
  columnHelper.accessor("clubNameKr", {
    id: "clubName",
    header: "동아리",
    cell: info => info.getValue(),
  }),
  columnHelper.accessor("representativeName", {
    id: "president",
    header: "대표자",
    cell: info => info.getValue(),
  }),
  columnHelper.accessor("activityFieldKr", {
    id: "activityField",
    header: "활동 분야",
    cell: info => info.getValue(),
    size: 240,
  }),
  columnHelper.accessor("professorName", {
    id: "advisorProfessor",
    header: "지도교수",
    cell: info => info.getValue(),
  }),
];

const ClubRegistrationTable: React.FC<ApiReg014ResponseOk> = ({
  items,
  total,
}) => {
  const table = useReactTable({
    columns,
    data: items,
    getCoreRowModel: getCoreRowModel(),
    enableSorting: false,
  });

  return (
    <Table
      table={table}
      count={total}
      emptyMessage="동아리 등록 신청 내역이 없습니다."
      rowLink={row => `/manage-club/permanent/register-club/${row.id}`}
    />
  );
};

export default ClubRegistrationTable;
