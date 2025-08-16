import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { formatDate } from "date-fns";
import { ko } from "date-fns/locale";
import { overlay } from "overlay-kit";
import { useMemo } from "react";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import Button from "@sparcs-clubs/web/common/components/Button";
import TextButton from "@sparcs-clubs/web/common/components/Buttons/TextButton";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import SectionTitle from "@sparcs-clubs/web/common/components/SectionTitle";
import Table from "@sparcs-clubs/web/common/components/Table";
import useGetSemesters from "@sparcs-clubs/web/common/services/getSemesters";
import useDeleteSemester from "@sparcs-clubs/web/features/executive/services/deleteSemester";
import usePostSemester from "@sparcs-clubs/web/features/executive/services/postSemester";
import usePutSemester from "@sparcs-clubs/web/features/executive/services/putSemester";

import SemesterFormModal, {
  type SemesterData,
} from "../components/SemesterFormModal";

const openSemesterModal = (
  onSave: (data: Omit<SemesterData, "id">) => void,
  initialData?: SemesterData,
) => {
  overlay.open(({ isOpen, close }) => (
    <SemesterFormModal
      isOpen={isOpen}
      onClose={close}
      onSave={onSave}
      initialData={initialData}
    />
  ));
};

const SemesterActionButtons = ({
  semesterId,
  semesters,
  onEdit,
  onDelete,
  editDisabled,
  deleteDisabled,
}: {
  semesterId: number;
  semesters: SemesterData[];
  onEdit: (id: number, data: Omit<SemesterData, "id">) => void;
  onDelete: (id: number) => void;
  editDisabled: boolean;
  deleteDisabled: boolean;
}) => {
  const semester = semesters.find(s => s.id === semesterId);

  const handleEdit = () =>
    openSemesterModal(data => onEdit(semesterId, data), semester);
  const handleDelete = () => onDelete(semesterId);

  return (
    <FlexWrapper direction="row" gap={8}>
      <TextButton text="수정" onClick={handleEdit} disabled={editDisabled} />
      <TextButton
        text="삭제"
        onClick={handleDelete}
        disabled={deleteDisabled}
      />
    </FlexWrapper>
  );
};

const ManageSemesterFrame = () => {
  const {
    data: semesterResponse,
    isLoading,
    isError,
  } = useGetSemesters({
    pageOffset: 1,
    itemCount: 1000, // 충분히 큰 숫자
  });

  const postSemester = usePostSemester();
  const putSemester = usePutSemester();
  const deleteSemester = useDeleteSemester();

  const sortedSemesters = useMemo(() => {
    if (!semesterResponse?.semesters) return [];
    return [...semesterResponse.semesters].sort(
      (a, b) => b.startTerm.getTime() - a.startTerm.getTime(),
    );
  }, [semesterResponse?.semesters]);

  const handleAddSemester = (data: Omit<SemesterData, "id">) => {
    postSemester.mutate({
      body: {
        name: data.name,
        year: data.year,
        startTerm: data.startTerm,
        endTerm: data.endTerm,
      },
    });
  };

  const handleEditSemester = (id: number, data: Omit<SemesterData, "id">) => {
    const existingSemester = sortedSemesters.find(s => s.id === id);
    if (!existingSemester) return;

    putSemester.mutate({
      query: {
        name: existingSemester.name,
        year: existingSemester.year,
      },
      body: {
        startTerm: data.startTerm,
        endTerm: data.endTerm,
      },
    });
  };

  const handleDeleteSemester = (id: number) => {
    const semesterToDelete = sortedSemesters.find(s => s.id === id);
    if (!semesterToDelete) return;

    deleteSemester.mutate({
      query: {
        name: semesterToDelete.name,
        year: semesterToDelete.year,
      },
    });
  };

  const columnHelper = createColumnHelper<SemesterData>();

  const actionsCellRenderer = (id: number) => (
    <SemesterActionButtons
      semesterId={id}
      semesters={sortedSemesters}
      onEdit={handleEditSemester}
      onDelete={handleDeleteSemester}
      editDisabled={putSemester.isPending}
      deleteDisabled={deleteSemester.isPending}
    />
  );

  const columns = [
    columnHelper.accessor("year", {
      header: "연도",
      cell: info => info.getValue(),
      size: 100,
      enableSorting: false,
    }),
    columnHelper.accessor("name", {
      header: "학기",
      cell: info => info.getValue(),
      size: 120,
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
    columnHelper.display({
      id: "actions",
      header: "관리",
      cell: ({ row }) => actionsCellRenderer(row.original.id),
      size: 120,
    }),
  ];

  const table = useReactTable({
    data: sortedSemesters,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <AsyncBoundary isLoading={isLoading} isError={isError}>
      <FlexWrapper direction="column" gap={20}>
        <FlexWrapper direction="row" justify="space-between">
          <SectionTitle>학기 관리</SectionTitle>
          <Button
            type={postSemester.isPending ? "disabled" : "default"}
            onClick={() => openSemesterModal(handleAddSemester)}
          >
            새 학기 추가
          </Button>
        </FlexWrapper>
        <Table
          table={table}
          count={sortedSemesters.length}
          unit="개"
          emptyMessage="등록된 학기가 없습니다"
        />
      </FlexWrapper>
    </AsyncBoundary>
  );
};

export default ManageSemesterFrame;
