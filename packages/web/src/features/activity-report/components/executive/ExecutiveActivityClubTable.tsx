import {
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  RowSelectionState,
  useReactTable,
} from "@tanstack/react-table";
import React, { useEffect, useMemo, useState } from "react";

import { ApiAct023ResponseOk } from "@clubs/interface/api/activity/endpoint/apiAct023";

import Checkbox from "@sparcs-clubs/web/common/components/Checkbox";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import Table from "@sparcs-clubs/web/common/components/Table";
import CheckboxCenterPlacerStopPropagation from "@sparcs-clubs/web/common/components/Table/CheckboxCenterPlacerStopPropagation";
import Tag from "@sparcs-clubs/web/common/components/Tag";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import {
  ClubTypeTagList,
  getDivisionTagColor,
} from "@sparcs-clubs/web/constants/tableTagList";
import { getTagDetail } from "@sparcs-clubs/web/utils/getTagDetail";

interface ExecutiveActivityClubTableProps {
  activities?: ApiAct023ResponseOk["items"];
  total: number;
  selectedClubIds: number[];
  setSelectedClubIds: (clubIds: number[]) => void;
}

const columnHelper = createColumnHelper<ApiAct023ResponseOk["items"][number]>();
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
  columnHelper.accessor("clubTypeEnum", {
    header: "구분",
    cell: info => {
      const { color, text } = getTagDetail(info.getValue(), ClubTypeTagList);
      return <Tag color={color}>{text}</Tag>;
    },
    size: 125,
  }),
  columnHelper.accessor("divisionName", {
    header: "분과",
    cell: info => (
      <Tag color={getDivisionTagColor(info.getValue())}>{info.getValue()}</Tag>
    ),
    size: 120,
  }),
  columnHelper.accessor("clubNameKr", {
    header: "동아리",
    cell: info => info.getValue(),
    size: 140,
  }),
  columnHelper.accessor("advisor", {
    header: "지도교수",
    cell: info => info.getValue() || "-",
    size: 140,
  }),
  columnHelper.accessor(
    row => {
      const {
        pendingActivitiesCount,
        approvedActivitiesCount,
        rejectedActivitiesCount,
      } = row;
      const total =
        pendingActivitiesCount +
        approvedActivitiesCount +
        rejectedActivitiesCount;
      const reviewed = approvedActivitiesCount + rejectedActivitiesCount;
      const reviewRate = total ? (reviewed / total) * 100 : 0;
      if (total === 0) return "-";
      return `${reviewRate.toFixed(2)}% (${reviewed} / ${total})`;
    },
    {
      header: "검토율 (검토 / 전체)",
      cell: info => info.getValue(),
      size: 200,
    },
  ),
  columnHelper.accessor(
    row => {
      const {
        pendingActivitiesCount,
        approvedActivitiesCount,
        rejectedActivitiesCount,
      } = row;
      const total =
        pendingActivitiesCount +
        approvedActivitiesCount +
        rejectedActivitiesCount;
      const approvedRate = total ? (approvedActivitiesCount / total) * 100 : 0;
      if (total === 0) return "-";
      return `${approvedRate.toFixed(2)}% (${approvedActivitiesCount} / ${total})`;
    },
    {
      header: "승인율 (승인 / 전체)",
      cell: info => info.getValue(),
      size: 200,
    },
  ),
  columnHelper.accessor(row => row.chargedExecutive?.name, {
    header: "담당자",
    cell: info =>
      info.getValue() || (
        <Typography color="GRAY.300" fs={16} lh={24}>
          (미정)
        </Typography>
      ),
    size: 140,
  }),
];

const ExecutiveActivityClubTable: React.FC<ExecutiveActivityClubTableProps> = ({
  activities = [],
  total,
  selectedClubIds,
  setSelectedClubIds,
}) => {
  const initialRowValues = useMemo(
    () =>
      selectedClubIds.reduce((acc, clubId) => {
        const index = activities.findIndex(
          activity => activity.clubId === clubId,
        );
        return { ...acc, [index]: true };
      }, {}),
    [selectedClubIds, activities],
  );

  const [rowValues, setRowValues] =
    useState<RowSelectionState>(initialRowValues);

  useEffect(() => {
    setRowValues(initialRowValues);
  }, [initialRowValues]);

  const handleRowClick = (rowState: RowSelectionState) => {
    setRowValues(rowState);
    const newSelected = activities.filter((_, i) => rowState?.[i]);
    setSelectedClubIds(newSelected.map(activity => activity.clubId));
  };

  const table = useReactTable({
    data: activities,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      rowSelection: rowValues,
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

  let countString = `총 ${total}개`;
  if (selectedClubIds.length !== 0) {
    countString = `선택 항목 ${selectedClubIds.length}개 / 총 ${total}개`;
  }

  return (
    <FlexWrapper direction="column" gap={8} style={{ width: "100%" }}>
      <Typography fs={16} lh={20} style={{ flex: 1, textAlign: "right" }}>
        {countString}
      </Typography>
      <Table
        table={table}
        rowLink={row => `/executive/activity-report/club/${row.clubId}`}
      />
    </FlexWrapper>
  );
};

export default ExecutiveActivityClubTable;
