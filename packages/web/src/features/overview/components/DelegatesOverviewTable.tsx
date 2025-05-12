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
import Tag from "@sparcs-clubs/web/common/components/Tag";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import {
  ClubTypeTagList,
  getDivisionTagColor,
} from "@sparcs-clubs/web/constants/tableTagList";
import { getTagDetail } from "@sparcs-clubs/web/utils/getTagDetail";

interface DelegatesOverviewTableProps {
  delegates: ApiOvv001ResponseOK;
  columnFilters: ColumnFiltersState;
}

const columnHelper = createColumnHelper<ApiOvv001ResponseOK[number]>();
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
  columnHelper.accessor("representative.name", {
    header: "대표자/성명",
    size: 50,
  }),
  columnHelper.accessor("representative.studentNumber", {
    header: "대표자/학번",
    size: 50,
  }),
  columnHelper.accessor("representative.department", {
    header: "대표자/학과",
    size: 50,
  }),
  columnHelper.accessor("representative.phoneNumber", {
    header: "대표자/전화번호",
    size: 50,
  }),
  columnHelper.accessor("representative.kaistEmail", {
    header: "대표자/KAIST E-Mail",
    size: 50,
  }),
  columnHelper.accessor("delegate1.name", {
    header: "대의원1/성명",
    size: 50,
  }),
  columnHelper.accessor("delegate1.studentNumber", {
    header: "대의원1/학번",
    size: 50,
  }),
  columnHelper.accessor("delegate1.department", {
    header: "대의원1/학과",
    size: 50,
  }),
  columnHelper.accessor("delegate2.name", {
    header: "대의원2/성명",
    size: 50,
  }),
  columnHelper.accessor("delegate2.studentNumber", {
    header: "대의원2/학번",
    size: 50,
  }),
  columnHelper.accessor("delegate2.department", {
    header: "대의원2/학과",
    size: 50,
  }),
];

const DelegatesOverviewTable: React.FC<DelegatesOverviewTableProps> = ({
  delegates,
  // searchText,
  // divisions,
  columnFilters,
}) => {
  // useEffect(() => {}, [divisions]);

  const sortedActivities = useMemo(
    () => [...delegates].sort((a, b) => (a.clubId < b.clubId ? -1 : 1)),
    [delegates],
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

export default DelegatesOverviewTable;
