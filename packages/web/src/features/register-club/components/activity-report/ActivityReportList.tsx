import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { overlay } from "overlay-kit";
import React, { useCallback, useMemo } from "react";
import styled from "styled-components";

import { ApiAct011ResponseOk } from "@clubs/interface/api/activity/endpoint/apiAct011";

import Table from "@sparcs-clubs/web/common/components/Table";
import Tag from "@sparcs-clubs/web/common/components/Tag";
import { ActStatusTagList } from "@sparcs-clubs/web/constants/tableTagList";
import { ActivityReport } from "@sparcs-clubs/web/features/register-club/types/registerClub";
import {
  getActivityTypeLabel,
  getActivityTypeTagColor,
} from "@sparcs-clubs/web/types/activityType";
import { formatDate } from "@sparcs-clubs/web/utils/Date/formatDate";
import { getTagDetail } from "@sparcs-clubs/web/utils/getTagDetail";

import PastActivityReportModal from "./PastActivityReportModal";

interface ActivityReportListProps {
  data: ActivityReport[];
  profile: string;
  refetch?: () => void;
  clubId: number;
}

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
    header: "활동명",
    cell: info => info.getValue(),
    size: 128,
  }),
  columnHelper.accessor("activityTypeEnumId", {
    header: "활동 분류",
    cell: info => (
      <Tag color={getActivityTypeTagColor(info.getValue())}>
        {getActivityTypeLabel(info.getValue())}
      </Tag>
    ),
    size: 128,
  }),
  columnHelper.accessor(
    row =>
      `${formatDate(row.durations[0].startTerm)} ~ ${formatDate(row.durations[0].endTerm)}${row.durations.length > 1 ? ` 외 ${row.durations.length - 1}개` : ""}`,
    {
      header: "활동 기간",
      cell: info => info.getValue(),
      size: 255,
    },
  ),
];

const TableOuter = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: flex-start;
  gap: 8px;
  align-self: stretch;
`;

const ActivityReportList: React.FC<ActivityReportListProps> = ({
  data,
  profile,
  refetch = () => {},
  clubId,
}) => {
  const processedData = useMemo(
    () =>
      data.map(item => ({
        ...item,
        durations: item.durations.map(duration => ({
          startTerm: duration.startTerm!,
          endTerm: duration.endTerm!,
        })),
      })),
    [data],
  );

  const table = useReactTable({
    columns,
    data: processedData,
    getCoreRowModel: getCoreRowModel(),
    enableSorting: false,
  });

  const openPastActivityReportModal = useCallback(
    (activityId: number) => {
      overlay.open(({ isOpen, close }) => (
        <PastActivityReportModal
          profile={profile}
          activityId={activityId}
          isOpen={isOpen}
          close={() => {
            close();
            refetch();
          }}
          clubId={clubId}
        />
      ));
    },
    [profile, clubId],
  );

  return (
    <TableOuter>
      <Table
        table={table}
        count={data.length}
        onClick={row => openPastActivityReportModal(row.id)}
      />
    </TableOuter>
  );
};

export default ActivityReportList;
