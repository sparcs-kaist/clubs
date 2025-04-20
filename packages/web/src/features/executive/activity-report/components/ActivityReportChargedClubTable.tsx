import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import React, { useMemo } from "react";

import { ApiAct028ResponseOk } from "@clubs/interface/api/activity/endpoint/apiAct028";

import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import MoreDetailTitle from "@sparcs-clubs/web/common/components/MoreDetailTitle";
import Table from "@sparcs-clubs/web/common/components/Table";
import Tag from "@sparcs-clubs/web/common/components/Tag";
import {
  ActStatusTagList,
  ActTypeTagList,
} from "@sparcs-clubs/web/constants/tableTagList";
import { formatDateTime } from "@sparcs-clubs/web/utils/Date/formatDate";
import { getTagDetail } from "@sparcs-clubs/web/utils/getTagDetail";

import { sortActivitiesByStatusAndCommentedDate } from "../utils/sortActivities";

const columnHelper =
  createColumnHelper<ApiAct028ResponseOk["activities"][number]>();
const columns = [
  columnHelper.accessor("name", {
    header: "활동명",
    cell: info => info.getValue(),
    size: 400,
  }),
  columnHelper.accessor("activityTypeEnum", {
    header: "활동 분류",
    cell: info => {
      const { color, text } = getTagDetail(info.getValue(), ActTypeTagList);
      return <Tag color={color}>{text}</Tag>;
    },
    size: 248,
  }),
  columnHelper.accessor("commentedAt", {
    header: "검토 일시",
    cell: info => {
      const date = info.getValue();
      return date ? formatDateTime(date) : "-";
    },
    size: 220,
  }),
  columnHelper.accessor(row => row.commentedExecutive?.name, {
    header: "최종 검토자",
    cell: info => info.getValue() || "-",
    size: 120,
  }),
  columnHelper.accessor("activityStatusEnum", {
    header: "상태",
    cell: info => {
      const { color, text } = getTagDetail(info.getValue(), ActStatusTagList);
      return <Tag color={color}>{text}</Tag>;
    },
    size: 120,
  }),
];

const ActivityReportChargedClubTable: React.FC<{
  activities: ApiAct028ResponseOk["activities"];
}> = ({ activities }) => {
  const { length } = activities;

  const sortedActivities = useMemo(
    () => sortActivitiesByStatusAndCommentedDate(activities),
    [activities],
  );

  const table = useReactTable({
    data: sortedActivities,
    columns,
    getCoreRowModel: getCoreRowModel(),
    enableSorting: false,
  });

  return (
    <FlexWrapper direction="column" gap={16}>
      <MoreDetailTitle
        title={`${activities[0]?.club?.name || ""} (${length}개)`}
        moreDetail="내역 더보기"
        moreDetailPath={`/executive/activity-report/club/${activities[0]?.club?.id}`}
      />
      <Table
        table={table}
        rowLink={row => `/executive/activity-report/${row.id}`}
      />
    </FlexWrapper>
  );
};

export default ActivityReportChargedClubTable;
