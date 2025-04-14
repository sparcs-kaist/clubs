import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import React from "react";

import { ClubTypeEnum } from "@clubs/interface/common/enum/club.enum";

import Table from "@sparcs-clubs/web/common/components/Table";
import Tag from "@sparcs-clubs/web/common/components/Tag";
import { ClubTypeTagList } from "@sparcs-clubs/web/constants/tableTagList";
import { getTagColorFromDivision } from "@sparcs-clubs/web/types/clubdetail.types";
import { getTagDetail } from "@sparcs-clubs/web/utils/getTagDetail";

interface ChargedClubsAndProgresses {
  clubId: number;
  clubTypeEnum: ClubTypeEnum;
  divisionName: string;
  clubNameKr: string;
  clubNameEn: string;
  pendingActivitiesCount: number;
  approvedActivitiesCount: number;
  rejectedActivitiesCount: number;
}

export interface ExecutiveProgresses {
  executiveName: string;
  chargedClubsAndProgresses: ChargedClubsAndProgresses[];
}

const columnHelper = createColumnHelper<ChargedClubsAndProgresses>();
const columns = [
  columnHelper.accessor("clubTypeEnum", {
    header: "구분",
    cell: info => {
      const { color, text } = getTagDetail(info.getValue(), ClubTypeTagList);
      return <Tag color={color}>{text}</Tag>;
    },
    size: 50,
  }),
  columnHelper.accessor("divisionName", {
    header: "분과",
    cell: info => (
      <Tag color={getTagColorFromDivision(info.getValue())}>
        {info.getValue()}
      </Tag>
    ),
    size: 50,
  }),
  columnHelper.accessor("clubNameKr", {
    header: "동아리",
    cell: info => info.getValue(),
    size: 100,
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
      size: 100,
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
      size: 100,
    },
  ),
];

const ChargedActivityModalTable: React.FC<{
  data: ChargedClubsAndProgresses[];
  closeModal: () => void;
}> = ({ data, closeModal }) => {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    enableSorting: false,
  });

  const handleRowClick = (row: ChargedClubsAndProgresses) => {
    closeModal();
    return `/executive/activity-report/club/${row.clubId}`;
  };

  return <Table table={table} rowLink={row => handleRowClick(row)} />;
};

export default ChargedActivityModalTable;
