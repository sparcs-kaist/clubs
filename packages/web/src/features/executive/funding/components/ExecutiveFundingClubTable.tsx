import {
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  RowSelectionState,
  useReactTable,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";

import { ApiFnd008ResponseOk } from "@clubs/interface/api/funding/endpoint/apiFnd008";

import Checkbox from "@sparcs-clubs/web/common/components/Checkbox";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import Table from "@sparcs-clubs/web/common/components/Table";
import CheckboxCenterPlacerStopPropagation from "@sparcs-clubs/web/common/components/Table/CheckboxCenterPlacerStopPropagation";
import Tag from "@sparcs-clubs/web/common/components/Tag";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import { ClubTypeTagList } from "@sparcs-clubs/web/constants/tableTagList";
import { getTagColorFromDivision } from "@sparcs-clubs/web/types/clubdetail.types";
import { getTagDetail } from "@sparcs-clubs/web/utils/getTagDetail";

interface ExecutiveFundingClubTableProps {
  fundings: ApiFnd008ResponseOk;
  searchText: string;
  selectedClubIds: number[];
  setSelectedClubIds: (clubIds: number[]) => void;
}

const columnHelper = createColumnHelper<ApiFnd008ResponseOk["clubs"][number]>();
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
  columnHelper.accessor("typeEnum", {
    header: "구분",
    cell: info => {
      const { color, text } = getTagDetail(info.getValue(), ClubTypeTagList);
      return <Tag color={color}>{text}</Tag>;
    },
    size: 125,
  }),
  columnHelper.accessor(row => row.division.name, {
    header: "분과",
    cell: info => (
      <Tag color={getTagColorFromDivision(info.getValue())}>
        {info.getValue()}
      </Tag>
    ),
    size: 120,
  }),
  columnHelper.accessor("name", {
    header: "동아리",
    cell: info => info.getValue(),
    size: 140,
  }),
  // columnHelper.accessor(row => row.professor?.name, {
  //   header: "지도교수",
  //   cell: info => info.getValue() || "-",
  //   size: 140,
  // }),
  columnHelper.accessor(
    row => {
      const total = row.totalCount;
      const reviewed = total - row.appliedCount;
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
      const total = row.totalCount;
      const approved = row.approvedCount;
      const approvedRate = total ? (approved / total) * 100 : 0;
      if (total === 0) return "-";
      return `${approvedRate.toFixed(2)}% (${approved} / ${total})`;
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

const ExecutiveFundingClubTable = ({
  fundings,
  searchText,
  selectedClubIds,
  setSelectedClubIds,
}: ExecutiveFundingClubTableProps) => {
  const sortedClubs = useMemo(
    () => [...fundings.clubs].sort((a, b) => (a.id < b.id ? -1 : 1)),
    [fundings.clubs],
  );

  const initialRowValues = useMemo(
    () =>
      selectedClubIds.reduce((acc, clubId) => {
        const index = sortedClubs.findIndex(club => club.id === clubId);
        return { ...acc, [index]: true };
      }, {}),
    [selectedClubIds, sortedClubs],
  );

  const [rowValues, setRowValues] =
    useState<RowSelectionState>(initialRowValues);

  const handleRowClick = (rowState: RowSelectionState) => {
    setRowValues(rowState);
    const newSelected = sortedClubs.filter((_, i) => rowState?.[i]);
    setSelectedClubIds(newSelected.map(club => club.id));
  };

  const table = useReactTable({
    data: sortedClubs,
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

  const totalCount = sortedClubs.length;

  let countString = `총 ${totalCount}개`;
  if (selectedClubIds.length !== 0) {
    countString = `선택 항목 ${selectedClubIds.length}개 / 총 ${totalCount}개`;
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
        rowLink={row => `/executive/funding/club/${row.id}`}
      />
    </FlexWrapper>
  );
};

export default ExecutiveFundingClubTable;
