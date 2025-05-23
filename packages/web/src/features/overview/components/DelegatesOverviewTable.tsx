import {
  ColumnFiltersState,
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";
import React, { useMemo } from "react";

import { ApiOvv001ResponseOK } from "@clubs/interface/api/overview/endpoint/apiOvv001";

import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import Table from "@sparcs-clubs/web/common/components/Table";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import OverviewCommonColumns from "@sparcs-clubs/web/features/overview/_atomic/OverviewCommonColumns";

interface DelegatesOverviewTableProps {
  delegates: ApiOvv001ResponseOK;
  columnFilters: ColumnFiltersState;
}

const columnHelper = createColumnHelper<ApiOvv001ResponseOK[number]>();
const columns = [
  ...OverviewCommonColumns<ApiOvv001ResponseOK[number]>(columnHelper),
  columnHelper.accessor(row => row.representative?.name ?? "-", {
    id: "representative.name",
    header: "대표자/성명",
    size: 100,
  }),
  columnHelper.accessor(row => row.representative?.studentNumber ?? "-", {
    id: "representative.studentNumber",
    header: "대표자/학번",
    size: 100,
  }),
  columnHelper.accessor(row => row.representative?.department ?? "-", {
    id: "representative.department",
    header: "대표자/학과",
    size: 100,
  }),
  columnHelper.accessor(row => row.representative?.phoneNumber ?? "-", {
    id: "representative.phoneNumber",
    header: "대표자/전화번호",
    size: 100,
  }),
  columnHelper.accessor(row => row.representative?.kaistEmail ?? "-", {
    id: "representative.kaistEmail",
    header: "대표자/KAIST E-Mail",
    size: 100,
  }),
  columnHelper.accessor(row => row.delegate1?.name ?? "-", {
    id: "delegate1.name",
    header: "대의원1/성명",
    size: 100,
  }),
  columnHelper.accessor(row => row.delegate1?.studentNumber ?? "-", {
    id: "delegate1.studentNumber",
    header: "대의원1/학번",
    size: 100,
  }),
  columnHelper.accessor(row => row.delegate1?.department ?? "-", {
    id: "delegate1.department",
    header: "대의원1/학과",
    size: 100,
  }),
  columnHelper.accessor(row => row.delegate2?.name ?? "-", {
    id: "delegate2.name",
    header: "대의원2/성명",
    size: 100,
  }),
  columnHelper.accessor(row => row.delegate2?.studentNumber ?? "-", {
    id: "delegate2.studentNumber",
    header: "대의원2/학번",
    size: 100,
  }),
  columnHelper.accessor(row => row.delegate2?.department ?? "-", {
    id: "delegate2.department",
    header: "대의원2/학과",
    size: 100,
  }),
];

const DelegatesOverviewTable: React.FC<DelegatesOverviewTableProps> = ({
  delegates,
  columnFilters,
}) => {
  const sortedActivities = useMemo(
    () => [...delegates].sort((a, b) => (a.clubId < b.clubId ? -1 : 1)),
    [delegates],
  );

  const table = useReactTable({
    data: sortedActivities,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      columnFilters,
    },
    enableSorting: false,
  });

  const totalCount = sortedActivities.length;

  let countString = `총 ${totalCount}개`;
  if (table.getRowModel().rows.length !== totalCount) {
    countString = `검색 결과 ${table.getRowModel().rows.length}개 / 총 ${totalCount}개`;
  }

  return (
    <FlexWrapper direction="column" gap={8}>
      <FlexWrapper direction="row" gap={8}>
        <Typography fs={16} lh={20} style={{ flex: 1, textAlign: "right" }}>
          {countString}
        </Typography>
      </FlexWrapper>
      <Table
        table={table}
        minWidth={columns.reduce((a, b) => a + (b.size ?? 0), 0)}
      />
    </FlexWrapper>
  );
};

export default DelegatesOverviewTable;
