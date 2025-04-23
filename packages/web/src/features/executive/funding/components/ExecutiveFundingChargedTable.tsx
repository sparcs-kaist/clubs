import {
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { overlay } from "overlay-kit";
import { useMemo } from "react";

import { ApiFnd008ResponseOk } from "@clubs/interface/api/funding/endpoint/apiFnd008";
import { ClubTypeEnum } from "@clubs/interface/common/enum/club.enum";

import TextButton from "@sparcs-clubs/web/common/components/Buttons/TextButton";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import Modal from "@sparcs-clubs/web/common/components/Modal";
import ConfirmModalContent from "@sparcs-clubs/web/common/components/Modal/ConfirmModalContent";
import Table from "@sparcs-clubs/web/common/components/Table";
import Typography from "@sparcs-clubs/web/common/components/Typography";

import ChargedFundingModalTable from "./ChargedFundingModalTable";

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

interface ExecutiveFundingChargedTableProps {
  fundings: ApiFnd008ResponseOk;
  searchText: string;
}

const openAssignModal = (data: ApiFnd008ResponseOk["executives"][number]) => {
  const chargedClubsData: ChargedClubAndFundings[] = data.chargedClubs.map(
    club => ({
      clubId: club.id,
      clubTypeEnum: club.typeEnum,
      divisionName: club.division.name,
      clubName: club.name,
      totalCount: data.totalCount,
      appliedCount: data.appliedCount,
      approvedCount: data.approvedCount,
      rejectedCount: data.rejectedCount,
      committeeCount: data.committeeCount,
      partialCount: data.partialCount,
    }),
  );

  overlay.open(({ isOpen, close }) => (
    <Modal isOpen={isOpen}>
      <ConfirmModalContent onConfirm={close}>
        <FlexWrapper
          direction="column"
          gap={12}
          style={{ width: "min(900px, 80vw)" }}
        >
          <Typography fs={16} lh={28} fw="MEDIUM" style={{ textAlign: "left" }}>
            {data.name} 지원금 검토 현황 상세
          </Typography>
          <ChargedFundingModalTable
            data={chargedClubsData}
            closeModal={close}
          />
        </FlexWrapper>
      </ConfirmModalContent>
    </Modal>
  ));
};

const columnHelper =
  createColumnHelper<ApiFnd008ResponseOk["executives"][number]>();
const columns = [
  columnHelper.accessor("name", {
    header: "담당자",
    cell: info => info.getValue(),
    size: 200,
  }),
  columnHelper.accessor(
    row => {
      const { chargedClubs } = row;
      const clubName = chargedClubs[0]?.name;
      if (!clubName) return "-";
      if (chargedClubs.length > 1) {
        return `${clubName} 외 ${chargedClubs.length - 1}개`;
      }
      return clubName;
    },
    {
      header: "동아리",
      cell: info => info.getValue(),
      size: 200,
    },
  ),
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
  columnHelper.accessor(row => row, {
    header: "상태",
    cell: info => (
      <TextButton
        text="보기"
        onClick={() => openAssignModal(info.getValue())}
      />
    ),
    size: 125,
  }),
];

const ExecutiveFundingChargedTable = ({
  fundings,
  searchText,
}: ExecutiveFundingChargedTableProps) => {
  const sortedExecutives = useMemo(
    () => [...fundings.executives].sort((a, b) => (a.name < b.name ? -1 : 1)),
    [fundings.executives],
  );

  const table = useReactTable({
    data: sortedExecutives,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      globalFilter: searchText,
    },
    enableSorting: false,
  });

  const totalCount = sortedExecutives.length;

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
        minWidth={800}
        rowLink={row => `/executive/funding/charged/${row.id}`}
      />
    </FlexWrapper>
  );
};

export default ExecutiveFundingChargedTable;
