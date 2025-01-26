import React, { useMemo } from "react";

import { ActivityStatusEnum } from "@sparcs-clubs/interface/common/enum/activity.enum";
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

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

import type { IActivitySummaryExecutiveResponse } from "@sparcs-clubs/interface/api/activity/type/activity.type";

const columnHelper =
  createColumnHelper<IActivitySummaryExecutiveResponse[][number]>();
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
  // TODO: 검토 일시 시간대 확인
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
  activities: IActivitySummaryExecutiveResponse[];
}> = ({ activities }) => {
  const { length } = activities;

  const sortedActivities = useMemo(() => {
    const statusOrder = {
      [ActivityStatusEnum.Applied]: 0,
      [ActivityStatusEnum.Rejected]: 1,
      [ActivityStatusEnum.Approved]: 2,
      [ActivityStatusEnum.Committee]: 3,
    };

    return activities.sort((a, b) => {
      if (
        statusOrder[a.activityStatusEnum] !== statusOrder[b.activityStatusEnum]
      ) {
        return (
          statusOrder[a.activityStatusEnum] - statusOrder[b.activityStatusEnum]
        );
      }
      if (a.commentedAt !== b.commentedAt) {
        if (!a.commentedAt) return -1;
        if (!b.commentedAt) return 1;
        return (
          new Date(b.commentedAt ?? b.updatedAt).getTime() -
          new Date(a.commentedAt ?? a.updatedAt).getTime()
        );
      }
      return 0;
    });
  }, [activities]);

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
