import {
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import React, { useState } from "react";
import styled from "styled-components";

import { ApiClb010ResponseOk } from "@clubs/interface/api/club/endpoint/apiClb010";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import FoldUnfoldButton from "@sparcs-clubs/web/common/components/Buttons/FoldUnfoldButton";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import Table from "@sparcs-clubs/web/common/components/Table";
import Typography from "@sparcs-clubs/web/common/components/Typography";

import { useFilteredMembers } from "../hooks/useFilteredMembers";
import { useGetClubMembers } from "../services/useGetClubMembers";
import { SemesterProps } from "../types/semesterList";

interface AllMemberListProps {
  semester: SemesterProps;
  clubId: number;
  searchText?: string;
}

const AllMemberListTitle = styled.div`
  display: flex;
  flex-direction: row;
`;

const columnHelper =
  createColumnHelper<ApiClb010ResponseOk["members"][number]>();

const columns = [
  columnHelper.accessor("studentNumber", {
    id: "studentNumber",
    header: "학번",
    cell: info => info.getValue(),
    size: 25,
  }),
  columnHelper.accessor("name", {
    id: "name",
    header: "신청자",
    cell: info => info.getValue(),
    size: 25,
  }),
  columnHelper.accessor("phoneNumber", {
    id: "phoneNumber",
    header: "전화번호",
    cell: info => info.getValue() ?? "-",
    size: 25,
    enableSorting: false,
  }),
  columnHelper.accessor("email", {
    id: "email",
    header: "이메일",
    cell: info => info.getValue(),
    size: 25,
    enableSorting: false,
  }),
];

const AllMemberList: React.FC<AllMemberListProps> = ({
  semester,
  clubId,
  searchText = "",
}) => {
  const [folded, setFolded] = useState<boolean>(false);

  const {
    data: members,
    isLoading,
    isError,
  } = useGetClubMembers({
    clubId,
    semesterId: semester.id,
  });

  const searchedMembers = useFilteredMembers(members.members, searchText);
  const memberCount = searchedMembers.length;

  const table = useReactTable({
    columns,
    data: searchedMembers,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <FlexWrapper direction="column" gap={20}>
      <AllMemberListTitle>
        <Typography fs={20} lh={24} color="BLACK" style={{ flex: 1 }}>
          {`${semester.year}년 ${semester.name}학기 (총 ${memberCount}명)`}
        </Typography>
        <FoldUnfoldButton folded={folded} setFolded={setFolded} />
      </AllMemberListTitle>

      <AsyncBoundary isLoading={isLoading} isError={isError}>
        {!folded && <Table table={table} count={memberCount} />}
      </AsyncBoundary>
    </FlexWrapper>
  );
};

export default AllMemberList;
