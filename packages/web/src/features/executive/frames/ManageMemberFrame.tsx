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

import ExecutiveMemberFormModal, {
  ExecutiveMemberData,
} from "../components/ExecutiveMemberFormModal";
import useDeleteExecutiveMember from "../services/deleteExecutiveMember";
import useGetExecutiveMembers from "../services/getExecutiveMembers";
import usePostExecutiveMember from "../services/postExecutiveMember";

const openExecutiveMemberModal = (
  onSave: (data: Omit<ExecutiveMemberData, "id">) => void,
) => {
  overlay.open(({ isOpen, close }) => (
    <ExecutiveMemberFormModal isOpen={isOpen} onClose={close} onSave={onSave} />
  ));
};

const ManageMemberFrame = () => {
  const { data, isLoading, isError } = useGetExecutiveMembers();

  const postExecutiveMember = usePostExecutiveMember();
  const deleteExecutiveMember = useDeleteExecutiveMember();

  const sortedMembers = useMemo(() => {
    if (!data?.executives) return [];
    return [...data.executives].sort(
      (a, b) => b.startTerm.getTime() - a.startTerm.getTime(),
    );
  }, [data?.executives]);

  const handleAddExecutiveMember = (
    member: Omit<ExecutiveMemberData, "id">,
  ) => {
    postExecutiveMember.mutate({
      body: {
        name: member.name,
        studentNumber: member.studentNumber,
        startTerm: member.startTerm,
        endTerm: member.endTerm,
      },
    });
  };

  const handleDeleteExecutiveMember = (id: number) => {
    const memberToDelete = sortedMembers.find(m => m.id === id);
    if (!memberToDelete) return;

    deleteExecutiveMember.mutate({
      param: {
        executiveId: memberToDelete.id,
      },
    });
  };

  const columnHelper = createColumnHelper<ExecutiveMemberData>();

  const actionsCellRenderer = (id: number) => (
    <TextButton
      text="삭제"
      onClick={() => handleDeleteExecutiveMember(id)}
      disabled={deleteExecutiveMember.isPending}
    />
  );

  const columns = [
    columnHelper.accessor("name", {
      header: "이름",
      cell: info => info.getValue(),
      size: 100,
      enableSorting: false,
    }),
    columnHelper.accessor("studentNumber", {
      header: "학번",
      cell: info => info.getValue(),
      size: 120,
      enableSorting: false,
    }),
    columnHelper.accessor("startTerm", {
      header: "시작일",
      cell: info =>
        info.getValue()
          ? formatDate(info.getValue(), "yyyy-MM-dd (ccc)", { locale: ko })
          : "-",
      size: 150,
      enableSorting: false,
    }),
    columnHelper.accessor("endTerm", {
      header: "종료일",
      cell: info =>
        info.getValue()
          ? formatDate(info.getValue(), "yyyy-MM-dd (ccc)", { locale: ko })
          : "-",
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
    data: sortedMembers,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <AsyncBoundary isLoading={isLoading} isError={isError}>
      <FlexWrapper direction="column" gap={20}>
        <FlexWrapper direction="row" justify="space-between">
          <SectionTitle>집행부원 관리</SectionTitle>
          <Button
            type={postExecutiveMember.isPending ? "disabled" : "default"}
            onClick={() => openExecutiveMemberModal(handleAddExecutiveMember)}
          >
            집행부원 추가
          </Button>
        </FlexWrapper>
        <Table
          table={table}
          count={sortedMembers.length}
          unit="명"
          emptyMessage="등록된 집행부원이 없습니다"
        />
      </FlexWrapper>
    </AsyncBoundary>
  );
};

export default ManageMemberFrame;
