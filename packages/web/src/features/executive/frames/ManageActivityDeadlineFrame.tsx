import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { formatDate } from "date-fns";
import { ko } from "date-fns/locale";
import { overlay } from "overlay-kit";
import React, { useCallback, useMemo } from "react";

import { ActivityDeadlineEnum } from "@clubs/domain/semester/deadline";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import IconButton from "@sparcs-clubs/web/common/components/Buttons/IconButton";
import TextButton from "@sparcs-clubs/web/common/components/Buttons/TextButton";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import SectionTitle from "@sparcs-clubs/web/common/components/SectionTitle";
import Table from "@sparcs-clubs/web/common/components/Table";

import ActivityDeadlineFormModal from "../components/ActivityDeadlineFormModal";
import useGetActivityDeadlines from "../services/getActivityDeadlines";
import useDeleteActivityDeadline from "../services/useDeleteActivityDeadline";

interface ActivityDeadlineData {
  id: number;
  semesterId: number;
  activityDId: number;
  activityDurationName: string;
  deadlineEnum: ActivityDeadlineEnum;
  startTerm: Date;
  endTerm: Date;
}

const getDeadlineTypeText = (deadlineEnum: ActivityDeadlineEnum): string => {
  switch (deadlineEnum) {
    case ActivityDeadlineEnum.Writing:
      return "작성";
    case ActivityDeadlineEnum.Late:
      return "지연제출";
    case ActivityDeadlineEnum.Modification:
      return "수정제출";
    case ActivityDeadlineEnum.Exception:
      return "예외";
    default:
      return "알 수 없음";
  }
};

const ManageActivityDeadlineFrame = () => {
  const {
    data: deadlineResponse,
    isLoading,
    isError,
  } = useGetActivityDeadlines();

  const { mutate: deleteActivityDeadline } = useDeleteActivityDeadline();

  const sortedDeadlines = useMemo(() => {
    if (!deadlineResponse?.deadlines) return [];
    return [...deadlineResponse.deadlines].sort(
      (a, b) => new Date(b.endTerm).getTime() - new Date(a.endTerm).getTime(),
    );
  }, [deadlineResponse?.deadlines]);

  const openActivityDeadlineModal = () => {
    overlay.open(({ isOpen, close }) => (
      <ActivityDeadlineFormModal isOpen={isOpen} onClose={close} />
    ));
  };

  const handleDelete = useCallback(
    (deadlineId: number) => {
      deleteActivityDeadline({ deadlineId });
    },
    [deleteActivityDeadline],
  );

  const actionsCellRenderer = (deadlineId: number) => (
    <TextButton text="삭제" onClick={() => handleDelete(deadlineId)} />
  );

  const columnHelper = createColumnHelper<ActivityDeadlineData>();

  const columns = [
    columnHelper.accessor("activityDurationName", {
      header: "활동기간명",
      cell: info => info.getValue(),
      size: 120,
      enableSorting: false,
    }),
    columnHelper.accessor("deadlineEnum", {
      header: "기간유형",
      cell: info => getDeadlineTypeText(info.getValue()),
      size: 100,
      enableSorting: false,
    }),
    columnHelper.accessor("startTerm", {
      header: "시작일",
      cell: info =>
        formatDate(info.getValue(), "yyyy-MM-dd (ccc)", { locale: ko }),
      size: 150,
      enableSorting: false,
    }),
    columnHelper.accessor("endTerm", {
      header: "종료일",
      cell: info =>
        formatDate(info.getValue(), "yyyy-MM-dd (ccc)", { locale: ko }),
      size: 150,
      enableSorting: false,
    }),
    columnHelper.accessor("id", {
      header: "삭제",
      cell: info => actionsCellRenderer(info.getValue()),
      size: 80,
      enableSorting: false,
    }),
  ];

  const table = useReactTable({
    data: sortedDeadlines,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <AsyncBoundary isLoading={isLoading} isError={isError}>
      <FlexWrapper direction="column" gap={20}>
        <FlexWrapper direction="row" justify="space-between">
          <SectionTitle>활동보고서 제출 기한 관리</SectionTitle>
          <IconButton
            type="default"
            icon="add"
            onClick={openActivityDeadlineModal}
          >
            새 기한 추가
          </IconButton>
        </FlexWrapper>
        <Table
          table={table}
          count={sortedDeadlines.length}
          unit="개"
          emptyMessage="등록된 활동보고서 제출 기한이 없습니다"
        />
      </FlexWrapper>
    </AsyncBoundary>
  );
};

export default ManageActivityDeadlineFrame;
