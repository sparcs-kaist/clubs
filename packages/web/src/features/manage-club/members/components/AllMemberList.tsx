import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import React, { useEffect, useState } from "react";
import styled from "styled-components";

import { ApiClb010ResponseOk } from "@sparcs-clubs/interface/api/club/endpoint/apiClb010";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import FoldUnfoldButton from "@sparcs-clubs/web/common/components/Buttons/FoldUnfoldButton";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import Table from "@sparcs-clubs/web/common/components/Table";
import Typography from "@sparcs-clubs/web/common/components/Typography";

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

const TableWithCount = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
`;

const columnHelper =
  createColumnHelper<ApiClb010ResponseOk["members"][number]>();

const columns = [
  columnHelper.accessor("studentNumber", {
    id: "studentNumber",
    header: "학번",
    cell: info => info.getValue(),
    size: 20,
  }),
  columnHelper.accessor("name", {
    id: "name",
    header: "신청자",
    cell: info => info.getValue(),
    size: 20,
  }),
  columnHelper.accessor("phoneNumber", {
    id: "phoneNumber",
    header: "전화번호",
    cell: info => info.getValue(),
    size: 20,
    enableSorting: false,
  }),
  columnHelper.accessor("email", {
    id: "email",
    header: "이메일",
    cell: info => info.getValue(),
    size: 20,
    enableSorting: false,
  }),
  columnHelper.display({
    id: "remarks",
    header: "비고",
    cell: () => " ",
    size: 20,
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

  const [searchedMembers, setSearchedMembers] = useState(
    members.members.filter(member => member.name.startsWith(searchText)),
  );

  const memberCount = searchedMembers.length;

  useEffect(() => {
    setSearchedMembers(
      members.members.filter(member => member.name.startsWith(searchText)),
    );
  }, [members.members, searchText]);

  const table = useReactTable({
    columns,
    data: searchedMembers,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <FlexWrapper direction="column" gap={20}>
      <AllMemberListTitle>
        <Typography
          fs={20}
          fw="MEDIUM"
          lh={24}
          ff="PRETENDARD"
          color="BLACK"
          style={{ flex: 1 }}
        >
          {`${semester.year}년 ${semester.name}학기 (총 ${memberCount}명)`}
        </Typography>
        <FoldUnfoldButton folded={folded} setFolded={setFolded} />
      </AllMemberListTitle>

      <AsyncBoundary isLoading={isLoading} isError={isError}>
        {!folded && (
          <TableWithCount>
            <Typography
              fw="REGULAR"
              fs={16}
              lh={20}
              ff="PRETENDARD"
              color="GRAY.600"
            >
              총 {memberCount}명
            </Typography>
            <Table table={table} />
          </TableWithCount>
        )}
      </AsyncBoundary>
    </FlexWrapper>
  );
};

export default AllMemberList;
