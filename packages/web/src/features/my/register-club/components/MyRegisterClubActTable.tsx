import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { overlay } from "overlay-kit";
import React from "react";
import styled from "styled-components";

import { ApiAct011ResponseOk } from "@clubs/interface/api/activity/endpoint/apiAct011";

import Table from "@sparcs-clubs/web/common/components/Table";
import Tag from "@sparcs-clubs/web/common/components/Tag";
import {
  ActStatusTagList,
  ActTypeTagList,
} from "@sparcs-clubs/web/constants/tableTagList";
import PastActivityReportModal from "@sparcs-clubs/web/features/register-club/components/activity-report/PastActivityReportModal";
import { formatDate } from "@sparcs-clubs/web/utils/Date/formatDate";
import { getTagDetail } from "@sparcs-clubs/web/utils/getTagDetail";

interface MyRegisterClubActTableProps {
  clubRegisterActList: ApiAct011ResponseOk;
  profile: string;
  clubId: number;
}

const TableWrapper = styled.div`
  overflow: hidden;
  -ms-overflow-style: none;

  ::-webkit-scrollbar {
    display: none;
  }
`;

const columnHelper =
  createColumnHelper<ApiAct011ResponseOk["activities"][number]>();

const columns = [
  columnHelper.accessor("activityStatusEnumId", {
    id: "activityStatusEnumId",
    header: "상태",
    cell: info => {
      const { color, text } = getTagDetail(info.getValue(), ActStatusTagList);
      return <Tag color={color}>{text}</Tag>;
    },
    size: 64,
  }),
  columnHelper.accessor("name", {
    id: "activityName",
    header: "활동명",
    cell: info => info.getValue(),
    size: 128,
  }),
  columnHelper.accessor("activityTypeEnumId", {
    id: "activityType",
    header: "분과",
    cell: info => {
      const { color, text } = getTagDetail(info.getValue(), ActTypeTagList);
      return <Tag color={color}>{text}</Tag>;
    },
    size: 128,
  }),
  columnHelper.accessor(
    row =>
      `${formatDate(row.durations[0].startTerm)} ~ ${formatDate(row.durations[0].endTerm)}${row.durations.length > 1 ? ` 외 ${row.durations.length - 1}개` : ""}`,
    {
      id: "activityPeriod",
      header: "활동 기간",
      cell: info => info.getValue(),
      size: 255,
    },
  ),
];

const MyRegisterClubActTable: React.FC<MyRegisterClubActTableProps> = ({
  clubRegisterActList,
  profile,
  clubId,
}) => {
  const table = useReactTable({
    columns,
    data: clubRegisterActList.activities,
    getCoreRowModel: getCoreRowModel(),
    enableSorting: false,
  });

  const openPastActivityReportModal = (activityId: number) => {
    overlay.open(({ isOpen, close }) => (
      <PastActivityReportModal
        profile={profile}
        activityId={activityId}
        isOpen={isOpen}
        close={close}
        viewOnly
        clubId={clubId}
      />
    ));
  };

  return (
    <TableWrapper>
      <Table
        table={table}
        emptyMessage="활동 보고서 작성 내역이 없습니다."
        onClick={row => openPastActivityReportModal(row.id)}
      />
    </TableWrapper>
  );
};

export default MyRegisterClubActTable;
