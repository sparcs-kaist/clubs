import {
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  RowSelectionState,
  useReactTable,
} from "@tanstack/react-table";
import React, { useMemo, useState } from "react";

import { ApiFnd009ResponseOk } from "@clubs/interface/api/funding/endpoint/apiFnd009";
import { FundingStatusEnum } from "@clubs/interface/common/enum/funding.enum";

import Checkbox from "@sparcs-clubs/web/common/components/Checkbox";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import Table from "@sparcs-clubs/web/common/components/Table";
import CheckboxCenterPlacerStopPropagation from "@sparcs-clubs/web/common/components/Table/CheckboxCenterPlacerStopPropagation";
import Tag from "@sparcs-clubs/web/common/components/Tag";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import { FundingTagList } from "@sparcs-clubs/web/constants/tableTagList";
import { getTagDetail } from "@sparcs-clubs/web/utils/getTagDetail";

interface ExecutiveClubFundingsTableProps {
  data: ApiFnd009ResponseOk;
  searchText?: string;
  selectedFundingIds?: number[];
  setSelectedFundingIds?: (fundingIds: number[]) => void;
  isPast?: boolean;
}

type FundingSummary = ApiFnd009ResponseOk["fundings"][number];

const columnHelper = createColumnHelper<FundingSummary>();
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
  columnHelper.accessor("fundingStatusEnum", {
    header: "상태",
    cell: info => {
      const { color, text } = getTagDetail(info.getValue(), FundingTagList);
      if (info.getValue() === FundingStatusEnum.Applied) {
        return <Tag color="GRAY">대기</Tag>;
      }
      return <Tag color={color}>{text}</Tag>;
    },
    size: 120,
  }),
  columnHelper.accessor(row => row.purposeActivity?.name, {
    header: "활동명",
    cell: info => info.getValue() || "활동보고서로 증빙 불가",
    size: 200,
  }),
  columnHelper.accessor("name", {
    header: "항목명",
    cell: info => info.getValue(),
    size: 200,
  }),
  columnHelper.accessor("expenditureAmount", {
    header: "신청 금액",
    cell: info => `${info.getValue().toLocaleString()}원`,
    size: 120,
  }),
  columnHelper.accessor("approvedAmount", {
    header: "승인 금액",
    cell: info => {
      const value = info.getValue();
      return value !== undefined ? `${value.toLocaleString()}원` : "-";
    },
    size: 120,
  }),
  columnHelper.accessor(row => row.commentedExecutive?.name, {
    header: "최종 검토자",
    cell: info => info.getValue() || "-",
    size: 140,
  }),
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

const sortFundingsByStatusAndId = (fundings: FundingSummary[]) => {
  const statusOrder = {
    [FundingStatusEnum.Applied]: 0,
    [FundingStatusEnum.Approved]: 1,
    [FundingStatusEnum.Rejected]: 2,
    [FundingStatusEnum.Committee]: 3,
    [FundingStatusEnum.Partial]: 4,
  };

  return [...fundings].sort((a, b) => {
    const statusDiff =
      statusOrder[a.fundingStatusEnum] - statusOrder[b.fundingStatusEnum];
    if (statusDiff !== 0) return statusDiff;
    return a.id - b.id;
  });
};

const ExecutiveClubFundingsTable: React.FC<ExecutiveClubFundingsTableProps> = ({
  data,
  searchText = "",
  selectedFundingIds = [],
  setSelectedFundingIds = () => {},
  isPast = false,
}) => {
  const sortedFundings = useMemo(
    () => (data.fundings ? sortFundingsByStatusAndId(data.fundings) : []),
    [data],
  );

  const initialRowValues = useMemo(
    () =>
      selectedFundingIds.reduce((acc, fundingId) => {
        const index = sortedFundings.findIndex(
          funding => funding.id === fundingId,
        );
        return { ...acc, [index]: true };
      }, {}),
    [selectedFundingIds, sortedFundings],
  );

  const [rowValues, setRowValues] =
    useState<RowSelectionState>(initialRowValues);

  const handleRowClick = (rowState: RowSelectionState) => {
    setRowValues(rowState);
    const newSelected = sortedFundings.filter((_, i) => rowState?.[i]);
    setSelectedFundingIds(newSelected.map(funding => funding.id));
  };

  const table = useReactTable({
    data: sortedFundings,
    columns: isPast ? columns.slice(1) : columns,
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

  const totalCount = sortedFundings.length;

  let countString = `총 ${totalCount}개`;
  if (selectedFundingIds.length !== 0) {
    countString = `선택 항목 ${selectedFundingIds.length}개 / 총 ${totalCount}개`;
  } else if (table.getRowModel().rows.length !== totalCount) {
    countString = `검색 결과 ${table.getRowModel().rows.length}개 / 총 ${totalCount}개`;
  }

  return (
    <FlexWrapper direction="column" gap={8}>
      <Typography fs={16} lh={20} style={{ flex: 1, textAlign: "right" }}>
        {countString}
      </Typography>
      <Table table={table} rowLink={row => `/executive/funding/${row.id}`} />
    </FlexWrapper>
  );
};

export default ExecutiveClubFundingsTable;
