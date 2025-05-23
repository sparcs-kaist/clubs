import {
  ColumnFiltersState,
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";
import React, { useMemo } from "react";

import { ClubBuildingEnum } from "@clubs/domain/club/club-semester";

import { ApiOvv002ResponseOK } from "@clubs/interface/api/overview/endpoint/apiOvv002";

import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import Table from "@sparcs-clubs/web/common/components/Table";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import OverviewCommonColumns from "@sparcs-clubs/web/features/overview/_atomic/OverviewCommonColumns";

interface ClubInfoKROverviewTableProps {
  clubInfos: ApiOvv002ResponseOK;
  columnFilters: ColumnFiltersState;
}

const columnHelper = createColumnHelper<ApiOvv002ResponseOK[number]>();
const columns = [
  ...OverviewCommonColumns<ApiOvv002ResponseOK[number]>(columnHelper),
  columnHelper.accessor("fieldsOfActivity", {
    id: "fieldsOfActivity",
    header: "활동분야",
    size: 180,
  }),
  columnHelper.accessor("foundingYear", {
    id: "foundingYear",
    header: "설립년도",
    size: 100,
  }),
  columnHelper.accessor(row => row.professor ?? "-", {
    id: "professor",
    header: "지도교수",
    size: 100,
  }),
  columnHelper.accessor("totalMemberCnt", {
    id: "totalMemberCnt",
    header: "회원수",
    size: 100,
  }),
  columnHelper.accessor("regularMemberCnt", {
    id: "regularMemberCnt",
    header: "정회원수",
    size: 100,
  }),
  columnHelper.accessor(
    row =>
      `${row.clubBuildingEnum ? ClubBuildingEnum[row.clubBuildingEnum] : "- "}/${row.roomLocation ?? " -"}`,
    {
      id: "roomLocation",
      header: "동아리방 위치",
      size: 80,
    },
  ),
  columnHelper.accessor("roomPassword", {
    id: "roomPassword",
    header: "동아리방 비번",
    size: 80,
  }),
  columnHelper.accessor(row => row.warning ?? "-", {
    id: "warning",
    header: "경고",
    size: 100,
  }),
  columnHelper.accessor(row => row.caution ?? "-", {
    id: "caution",
    header: "주의",
    size: 100,
  }),
];

const ClubInfoKROverviewTable: React.FC<ClubInfoKROverviewTableProps> = ({
  clubInfos,
  columnFilters,
}) => {
  const sortedActivities = useMemo(
    () => [...clubInfos].sort((a, b) => (a.clubId < b.clubId ? -1 : 1)),
    [clubInfos],
  );

  const table = useReactTable({
    data: sortedActivities,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: { columnFilters },
    enableSorting: false,
  });

  const totalCount = sortedActivities.length;

  let countString = `총 ${totalCount}개`;
  if (table.getRowModel().rows.length !== totalCount) {
    countString = `검색 결과 ${table.getRowModel().rows.length}개 / 총 ${totalCount}개`;
  }

  return (
    <FlexWrapper direction="column" gap={8}>
      <Typography fs={16} lh={20} style={{ flex: 1, textAlign: "right" }}>
        {countString}
      </Typography>
      <Table
        table={table}
        minWidth={columns.reduce((a, b) => a + (b.size ?? 0), 0)}
      />
    </FlexWrapper>
  );
};

export default ClubInfoKROverviewTable;
