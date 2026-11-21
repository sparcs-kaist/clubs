import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { overlay } from "overlay-kit";
import React from "react";

import type { ApiAct019ResponseOk } from "@clubs/interface/api/activity/endpoint/apiAct019";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import Button from "@sparcs-clubs/web/common/components/Button";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import Modal from "@sparcs-clubs/web/common/components/Modal";
import CancellableModalContent from "@sparcs-clubs/web/common/components/Modal/CancellableModalContent";
import ConfirmModalContent from "@sparcs-clubs/web/common/components/Modal/ConfirmModalContent";
import Table from "@sparcs-clubs/web/common/components/Table";
import Tag from "@sparcs-clubs/web/common/components/Tag";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import { ActTypeTagList } from "@sparcs-clubs/web/constants/tableTagList";
import useGetProfessorCurrentActivityReportList from "@sparcs-clubs/web/features/activity-report/services/useGetProfessorCurrentActivityReportList";
import usePostProfessorApproveActivityReport from "@sparcs-clubs/web/features/activity-report/services/useProfessorApproveActivityReport";
import { formatDate } from "@sparcs-clubs/web/utils/Date/formatDate";
import { getTagDetail } from "@sparcs-clubs/web/utils/getTagDetail";

import ActivityApprovalStatusTag from "../ActivityApprovalStatusTag";

interface ProfessorActivityReportTableProps {
  clubId: number;
}

const emptyReports: ApiAct019ResponseOk = [];
const columnHelper = createColumnHelper<ApiAct019ResponseOk[number]>();
const columns = [
  columnHelper.accessor("professorApprovalStatus", {
    header: "지도교수 승인",
    cell: info => (
      <ActivityApprovalStatusTag
        type="professor"
        status={info.getValue()}
        width="64px"
      />
    ),
    size: 16,
  }),
  columnHelper.accessor("name", {
    id: "activity",
    header: "활동명",
    cell: info => info.getValue(),
    size: 36,
  }),
  columnHelper.accessor("activityTypeEnumId", {
    header: "활동 분류",
    cell: info => {
      const { color, text } = getTagDetail(info.getValue(), ActTypeTagList);
      return <Tag color={color}>{text}</Tag>;
    },
    size: 20,
  }),
  columnHelper.accessor(
    row =>
      `${formatDate(row.durations[0].startTerm!)} ~ ${formatDate(row.durations[0].endTerm!)}${row.durations.length > 1 ? ` 외 ${row.durations.length - 1}개` : ""}`,
    {
      id: "date-range",
      header: "활동 기간",
      cell: info => info.getValue(),
      size: 28,
    },
  ),
];

const ProfessorActivityReportTable: React.FC<
  ProfessorActivityReportTableProps
> = ({ clubId }) => {
  const router = useRouter();

  const {
    data = emptyReports,
    isLoading,
    isError,
  } = useGetProfessorCurrentActivityReportList({ clubId });
  const { mutateAsync: approveActivityReport, isPending: isApproving } =
    usePostProfessorApproveActivityReport();

  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
    enableSorting: false,
  });

  const approvableActivityIds = data
    .filter(activity => activity.canProfessorApprove)
    .map(activity => activity.id);

  const handleApproveAll = async () => {
    try {
      await approveActivityReport({
        activityIds: approvableActivityIds,
        clubId,
      });
    } catch {
      overlay.open(({ isOpen, close }) => (
        <Modal isOpen={isOpen}>
          <ConfirmModalContent onConfirm={close}>
            활동 보고서 일괄 승인에 실패했습니다.
          </ConfirmModalContent>
        </Modal>
      ));
    }
  };

  const openApproveAllModal = () => {
    overlay.open(({ isOpen, close }) => (
      <Modal isOpen={isOpen}>
        <CancellableModalContent
          confirmButtonText="승인"
          onConfirm={async () => {
            close();
            await handleApproveAll();
          }}
          onClose={close}
        >
          승인 가능한 활동 보고서 {approvableActivityIds.length}건을 일괄
          승인합니다. <br />
          해당 작업은 되돌릴 수 없습니다.
        </CancellableModalContent>
      </Modal>
    ));
  };

  return (
    <AsyncBoundary isLoading={isLoading} isError={isError}>
      <FlexWrapper direction="row" gap={16} style={{ alignItems: "center" }}>
        <Typography fs={20} lh={24} fw="MEDIUM" style={{ flex: 1 }}>
          활동 보고서
        </Typography>
        <Button
          type={
            approvableActivityIds.length > 0 && !isApproving
              ? "default"
              : "disabled"
          }
          onClick={openApproveAllModal}
        >
          전체 승인
        </Button>
      </FlexWrapper>
      <Table
        table={table}
        count={data.length}
        onClick={row => router.push(`/manage-club/activity-report/${row.id}`)}
      />
    </AsyncBoundary>
  );
};

export default ProfessorActivityReportTable;
