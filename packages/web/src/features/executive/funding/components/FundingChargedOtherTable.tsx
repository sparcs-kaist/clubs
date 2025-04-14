import {
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";
import React, { useMemo } from "react";

import { ApiFnd010ResponseOk } from "@clubs/interface/api/funding/endpoint/apiFnd010";
import { FundingStatusEnum } from "@clubs/interface/common/enum/funding.enum";

import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import Table from "@sparcs-clubs/web/common/components/Table";
import Tag from "@sparcs-clubs/web/common/components/Tag";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import { FundingTagList } from "@sparcs-clubs/web/constants/tableTagList";
import { getTagDetail } from "@sparcs-clubs/web/utils/getTagDetail";

interface ExecutiveChargedFundingsTableProps {
  data: ApiFnd010ResponseOk["fundings"];
}

type FundingSummary = ApiFnd010ResponseOk["fundings"][number];

const columnHelper = createColumnHelper<FundingSummary>();
const columns = [
  columnHelper.accessor(row => row.club?.name, {
    header: "동아리",
    cell: info => info.getValue() || "-",
    size: 140,
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
  columnHelper.accessor(row => row.chargedExecutive?.name, {
    header: "담당자",
    cell: info => info.getValue() || "-",
    size: 120,
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
    size: 90,
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

const FundingChargedOtherTable: React.FC<
  ExecutiveChargedFundingsTableProps
> = ({ data }) => {
  const sortedFundings = useMemo(() => sortFundingsByStatusAndId(data), [data]);

  const table = useReactTable({
    data: sortedFundings,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableSorting: false,
  });

  return (
    <FlexWrapper direction="column" gap={16}>
      <Typography fs={20} lh={24} fw="MEDIUM">
        담당자가 아님 ({sortedFundings.length}개)
      </Typography>
      <Table table={table} rowLink={row => `/executive/funding/${row.id}`} />
    </FlexWrapper>
  );
};

export default FundingChargedOtherTable;
