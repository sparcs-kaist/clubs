import {
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  RowSelectionState,
  useReactTable,
} from "@tanstack/react-table";
import React, { useEffect, useMemo, useState } from "react";

import { ApiAct024ResponseOk } from "@clubs/interface/api/activity/endpoint/apiAct024";

import Checkbox from "@sparcs-clubs/web/common/components/Checkbox";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import Table from "@sparcs-clubs/web/common/components/Table";
import CheckboxCenterPlacerStopPropagation from "@sparcs-clubs/web/common/components/Table/CheckboxCenterPlacerStopPropagation";
import Tag from "@sparcs-clubs/web/common/components/Tag";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import { ActStatusTagList } from "@sparcs-clubs/web/constants/tableTagList";
import { formatDateTime } from "@sparcs-clubs/web/utils/Date/formatDate";
import { getTagDetail } from "@sparcs-clubs/web/utils/getTagDetail";

import { sortActivitiesByStatusAndActivityId } from "../utils/sortActivities";

interface ExecutiveClubActivitiesTableProps {
  data: ApiAct024ResponseOk;
  searchText: string;
  selectedActivityIds: number[];
  setSelectedActivityIds: (clubIds: number[]) => void;
}

const columnHelper = createColumnHelper<ApiAct024ResponseOk["items"][number]>();
const columns = [
  columnHelper.display({
    id: "multiSelect",
    cell: ({ row }) => (
      <CheckboxCenterPlacerStopPropagation
        onClick={e => {
          row.getToggleSelectedHandler()(e);
        }}
      >
        <Checkbox checked={row.getIsSelected()} />
      </CheckboxCenterPlacerStopPropagation>
    ),
    size: 56,
  }),
  columnHelper.accessor("activityStatusEnum", {
    header: "상태",
    cell: info => {
      const { color, text } = getTagDetail(info.getValue(), ActStatusTagList);
      return <Tag color={color}>{text}</Tag>;
    },
    size: 90,
  }),
  columnHelper.accessor("activityName", {
    header: "활동명",
    cell: info => info.getValue(),
    size: 300,
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
  columnHelper.accessor(row => row.chargedExecutive?.name, {
    header: "담당자",
    cell: info =>
      info.getValue() || (
        <Typography color="GRAY.300" fs={16} lh={24}>
          (미정)
        </Typography>
      ),
    size: 120,
  }),
];

const ExecutiveClubActivitiesTable: React.FC<
  ExecutiveClubActivitiesTableProps
> = ({ data, searchText, selectedActivityIds, setSelectedActivityIds }) => {
  const sortedActivities = useMemo(
    () => sortActivitiesByStatusAndActivityId(data.items),
    [data.items],
  );

  const initialRowValues = useMemo(
    () =>
      selectedActivityIds.reduce((acc, clubId) => {
        const index = sortedActivities.findIndex(
          activity => activity.activityId === clubId,
        );
        return { ...acc, [index]: true };
      }, {}),
    [selectedActivityIds, sortedActivities],
  );

  const [rowValues, setRowValues] =
    useState<RowSelectionState>(initialRowValues);

  useEffect(() => {
    setRowValues(initialRowValues);
  }, [initialRowValues]);

  const handleRowClick = (rowState: RowSelectionState) => {
    setRowValues(rowState);
    const newSelected = sortedActivities.filter((_, i) => rowState?.[i]);
    setSelectedActivityIds(newSelected.map(activity => activity.activityId));
  };

  const table = useReactTable({
    data: sortedActivities,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      rowSelection: rowValues,
      globalFilter: searchText,
    },
    onRowSelectionChange: updaterOrValue => {
      if (typeof updaterOrValue === "function") {
        handleRowClick(updaterOrValue(rowValues));
      } else {
        handleRowClick(updaterOrValue);
      }
    },
    enableSorting: false,
  });

  const totalCount = sortedActivities.length;

  let countString = `총 ${totalCount}개`;
  if (selectedActivityIds.length !== 0) {
    countString = `선택 항목 ${selectedActivityIds.length}개 / 총 ${totalCount}개`;
  } else if (table.getRowModel().rows.length !== totalCount) {
    countString = `검색 결과 ${table.getRowModel().rows.length}개 / 총 ${totalCount}개`;
  }

  return (
    <FlexWrapper direction="column" gap={8}>
      <Typography fs={16} lh={20} style={{ flex: 1, textAlign: "right" }}>
        {countString}
      </Typography>
      <Table
        table={table}
        rowLink={row => `/executive/activity-report/${row.activityId}`}
      />
    </FlexWrapper>
  );
};

export default ExecutiveClubActivitiesTable;
