import {
  ColumnFiltersState,
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";
import React, { useMemo } from "react";

import { ApiOvv002ResponseOK } from "@clubs/interface/api/overview/endpoint/apiOvv002";

import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import Table from "@sparcs-clubs/web/common/components/Table";
import Tag from "@sparcs-clubs/web/common/components/Tag";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import {
  ClubTypeTagList,
  getDivisionTagColor,
} from "@sparcs-clubs/web/constants/tableTagList";
import { getTagDetail } from "@sparcs-clubs/web/utils/getTagDetail";

interface ClubInfoKROverviewTableProps {
  clubs: ApiOvv002ResponseOK;
  columnFilters: ColumnFiltersState;
}

const columnHelper = createColumnHelper<ApiOvv002ResponseOK[number]>();
const columns = [
  columnHelper.accessor("clubTypeEnum", {
    header: "구분",
    cell: info => {
      const { color, text } = getTagDetail(info.getValue(), ClubTypeTagList);
      return <Tag color={color}>{text}</Tag>;
    },
    size: 50,
  }),
  columnHelper.accessor("district", {
    header: "분과구",
    size: 50,
  }),
  columnHelper.accessor("divisionName", {
    header: "분과",
    cell: info => (
      <Tag color={getDivisionTagColor(info.getValue())}>{info.getValue()}</Tag>
    ),
    size: 50,
  }),
  columnHelper.accessor("clubNameKr", {
    header: "동아리 대표명칭",
    size: 120,
  }),
  columnHelper.accessor("fieldsOfActivity", {
    header: "활동분야",
    size: 180,
  }),
  columnHelper.accessor("foundingYear", {
    header: "설립년도",
    size: 50,
  }),
  columnHelper.accessor("professor", {
    header: "지도교수",
    size: 50,
  }),
  columnHelper.accessor("totalMemberCnt", {
    header: "회원수",
    size: 50,
  }),
  columnHelper.accessor("regularMemberCnt", {
    header: "정회원수",
    size: 50,
  }),
  columnHelper.accessor("roomLocation", {
    header: "동아리방 위치",
    size: 50,
  }),
  columnHelper.accessor("roomPassword", {
    header: "동아리방 비번",
    size: 50,
  }),
  columnHelper.accessor("warning", {
    header: "경고",
    size: 50,
  }),
  columnHelper.accessor("caution", {
    header: "주의",
    size: 50,
  }),
];

const ClubInfoKROverviewTable: React.FC<ClubInfoKROverviewTableProps> = ({
  clubs,
  columnFilters,
}) => {
  const sortedActivities = useMemo(
    () => [...clubs].sort((a, b) => (a.clubId < b.clubId ? -1 : 1)),
    [clubs],
  );

  const totalCount = sortedActivities.length;

  const countString = `총 ${totalCount}개`;

  const table = useReactTable({
    data: sortedActivities,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: { columnFilters },
    enableSorting: false,
  });

  return (
    <FlexWrapper direction="column" gap={8}>
      <Typography fs={16} lh={20} style={{ flex: 1, textAlign: "right" }}>
        {countString}
      </Typography>
      <Table table={table} />
    </FlexWrapper>
  );
};

export default ClubInfoKROverviewTable;
