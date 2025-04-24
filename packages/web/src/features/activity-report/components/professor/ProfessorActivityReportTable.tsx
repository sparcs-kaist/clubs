import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { overlay } from "overlay-kit";
import React from "react";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import Button from "@sparcs-clubs/web/common/components/Button";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import Modal from "@sparcs-clubs/web/common/components/Modal";
import CancellableModalContent from "@sparcs-clubs/web/common/components/Modal/CancellableModalContent";
import Table from "@sparcs-clubs/web/common/components/Table";
import Tag from "@sparcs-clubs/web/common/components/Tag";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import {
  ActTypeTagList,
  ApplyTagList,
  ProfessorApprovalTagList,
} from "@sparcs-clubs/web/constants/tableTagList";
import useGetProfessorActivityReportList from "@sparcs-clubs/web/features/activity-report/hooks/useGetProfessorActivityReportList";
import usePostProfessorApproveActivityReport from "@sparcs-clubs/web/features/activity-report/services/useProfessorApproveActivityReport";
import { ProfessorActivityReportTableData } from "@sparcs-clubs/web/features/activity-report/types/table";
import ProfessorApprovalEnum from "@sparcs-clubs/web/types/professorApproval";
import { formatDate } from "@sparcs-clubs/web/utils/Date/formatDate";
import { getTagDetail } from "@sparcs-clubs/web/utils/getTagDetail";

interface ProfessorActivityReportTableProps {
  clubId: number;
}

const columnHelper = createColumnHelper<ProfessorActivityReportTableData>();
const columns = [
  columnHelper.accessor("activityStatusEnumId", {
    header: "상태",
    cell: info => {
      const { color, text } = getTagDetail(info.getValue(), ApplyTagList);
      return <Tag color={color}>{text}</Tag>;
    },
    size: 0,
  }),
  columnHelper.accessor("professorApproval", {
    id: "professorApproval",
    header: "지도교수",
    cell: info => {
      const { color, text } = getTagDetail(
        info.getValue(),
        ProfessorApprovalTagList,
      );
      return <Tag color={color}>{text}</Tag>;
    },
    size: 0,
  }),
  columnHelper.accessor("name", {
    id: "activity",
    header: "활동명",
    cell: info => info.getValue(),
    size: 20,
  }),
  columnHelper.accessor("activityTypeEnumId", {
    header: "활동 분류",
    cell: info => {
      const { color, text } = getTagDetail(info.getValue(), ActTypeTagList);
      return <Tag color={color}>{text}</Tag>;
    },
    size: 32,
  }),
  columnHelper.accessor(
    row =>
      `${formatDate(row.durations[0].startTerm)} ~ ${formatDate(row.durations[0].endTerm)}${row.durations.length > 1 ? ` 외 ${row.durations.length - 1}개` : ""}`,
    {
      id: "date-range",
      header: "활동 기간",
      cell: info => info.getValue(),
      size: 48,
    },
  ),
];

const ProfessorActivityReportTable: React.FC<
  ProfessorActivityReportTableProps
> = ({ clubId }) => {
  const router = useRouter();

  const { data, isLoading, isError } =
    useGetProfessorActivityReportList(clubId);
  const { mutate: approveActivityReport } =
    usePostProfessorApproveActivityReport();

  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
    enableSorting: false,
  });

  const hasActivitiesToApprove = data.some(
    activity => activity.professorApproval === ProfessorApprovalEnum.Pending,
  );

  const openApproveAllModal = () => {
    overlay.open(({ isOpen, close }) => (
      <Modal isOpen={isOpen}>
        <CancellableModalContent
          confirmButtonText="승인"
          onConfirm={() => {
            approveActivityReport({
              body: {
                activities: data.map(activity => ({ id: activity.id })),
              },
            });
            close();

            window.location.href = "/manage-club";
          }}
          onClose={close}
        >
          모든 활동 보고서를 일괄 승인합니다. <br />
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
          type={hasActivitiesToApprove ? "default" : "disabled"}
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
