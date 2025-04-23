import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { ClubTypeEnum } from "@clubs/interface/common/enum/club.enum";

import Table from "@sparcs-clubs/web/common/components/Table";
import Tag from "@sparcs-clubs/web/common/components/Tag";
import { ClubTypeTagList } from "@sparcs-clubs/web/constants/tableTagList";
import { getTagColorFromDivision } from "@sparcs-clubs/web/types/clubdetail.types";
import { getTagDetail } from "@sparcs-clubs/web/utils/getTagDetail";

interface ChargedClubAndFundings {
  clubId: number;
  clubTypeEnum: ClubTypeEnum;
  divisionName: string;
  clubName: string;
  totalCount: number;
  appliedCount: number;
  approvedCount: number;
  rejectedCount: number;
  committeeCount: number;
  partialCount: number;
}

const columnHelper = createColumnHelper<ChargedClubAndFundings>();
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
  columnHelper.accessor("clubName", {
    header: "동아리",
    cell: info => info.getValue(),
    size: 100,
  }),
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
      size: 100,
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
      size: 100,
    },
  ),
];

interface ChargedFundingModalTableProps {
  data: ChargedClubAndFundings[];
  closeModal: () => void;
}

const ChargedFundingModalTable = ({
  data,
  closeModal,
}: ChargedFundingModalTableProps) => {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    enableSorting: false,
  });

  const handleRowClick = (row: ChargedClubAndFundings) => {
    closeModal();
    return `/executive/funding/club/${row.clubId}`;
  };

  return <Table table={table} rowLink={row => handleRowClick(row)} />;
};

export default ChargedFundingModalTable;
