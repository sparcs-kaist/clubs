import {
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { overlay } from "overlay-kit";
import React from "react";

import { ApiAct023ResponseOk } from "@clubs/interface/api/activity/endpoint/apiAct023";

import TextButton from "@sparcs-clubs/web/common/components/Buttons/TextButton";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import Modal from "@sparcs-clubs/web/common/components/Modal";
import ConfirmModalContent from "@sparcs-clubs/web/common/components/Modal/ConfirmModalContent";
import Table from "@sparcs-clubs/web/common/components/Table";
import Typography from "@sparcs-clubs/web/common/components/Typography";

import ChargedActivityModalTable, {
  ExecutiveProgresses,
} from "./ChargedActivityModalTable";

interface ExecutiveActivityChargedTableProps {
  searchText: string;
  executives?: ApiAct023ResponseOk["executiveProgresses"];
}

const openAssignModal = (data: ExecutiveProgresses) => {
  overlay.open(({ isOpen, close }) => (
    <Modal isOpen={isOpen}>
      <ConfirmModalContent onConfirm={close}>
        <FlexWrapper
          direction="column"
          gap={12}
          style={{ width: "min(900px, 80vw)" }}
        >
          <Typography fs={16} lh={28} fw="MEDIUM" style={{ textAlign: "left" }}>
            {data.executiveName} 활동 보고서 검토 현황 상세
          </Typography>
          <ChargedActivityModalTable
            data={data.chargedClubsAndProgresses}
            closeModal={close}
          />
        </FlexWrapper>
      </ConfirmModalContent>
    </Modal>
  ));
};

const columnHelper =
  createColumnHelper<ApiAct023ResponseOk["executiveProgresses"][number]>();
const columns = [
  columnHelper.accessor("executiveName", {
    header: "담당자",
    cell: info => info.getValue(),
    size: 200,
  }),
  columnHelper.accessor(
    row => {
      const { chargedClubsAndProgresses } = row;
      const clubName = chargedClubsAndProgresses[0]?.clubNameKr;
      if (!clubName) return "-";
      if (chargedClubsAndProgresses.length > 1) {
        return `${clubName} 외 ${chargedClubsAndProgresses.length - 1}개`;
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
      const { chargedClubsAndProgresses } = row;
      const pendingActivitiesCount = chargedClubsAndProgresses.reduce(
        (acc, item) => acc + item.pendingActivitiesCount,
        0,
      );
      const approvedActivitiesCount = chargedClubsAndProgresses.reduce(
        (acc, item) => acc + item.approvedActivitiesCount,
        0,
      );
      const rejectedActivitiesCount = chargedClubsAndProgresses.reduce(
        (acc, item) => acc + item.rejectedActivitiesCount,
        0,
      );
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
      size: 200,
    },
  ),
  columnHelper.accessor(
    row => {
      const { chargedClubsAndProgresses } = row;
      const pendingActivitiesCount = chargedClubsAndProgresses.reduce(
        (acc, item) => acc + item.pendingActivitiesCount,
        0,
      );
      const approvedActivitiesCount = chargedClubsAndProgresses.reduce(
        (acc, item) => acc + item.approvedActivitiesCount,
        0,
      );
      const rejectedActivitiesCount = chargedClubsAndProgresses.reduce(
        (acc, item) => acc + item.rejectedActivitiesCount,
        0,
      );
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
      size: 200,
    },
  ),
  columnHelper.accessor(
    row => {
      const { executiveName, chargedClubsAndProgresses } = row;
      return {
        executiveName,
        chargedClubsAndProgresses,
      };
    },
    {
      header: "상태",
      cell: info => (
        <TextButton
          text="보기"
          onClick={() => openAssignModal(info.getValue())}
        />
      ),
      size: 125,
    },
  ),
];

const ExecutiveActivityChargedTable: React.FC<
  ExecutiveActivityChargedTableProps
> = ({ searchText, executives = [] }) => {
  const table = useReactTable({
    data: executives,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      globalFilter: searchText,
    },
    enableSorting: false,
  });

  const totalCount = executives.length;

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
        rowLink={row => `/executive/activity-report/charged/${row.executiveId}`}
      />
    </FlexWrapper>
  );
};

export default ExecutiveActivityChargedTable;
