import {
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import React from "react";

import { ApiClb002ResponseOK } from "@sparcs-clubs/interface/api/club/endpoint/apiClb002";
import { ApiClb010ResponseOk } from "@sparcs-clubs/interface/api/club/endpoint/apiClb010";
import { ApiClb015ResponseOk } from "@sparcs-clubs/interface/api/club/endpoint/apiClb015";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import FoldableSectionTitle from "@sparcs-clubs/web/common/components/FoldableSectionTitle";
import MoreDetailTitle from "@sparcs-clubs/web/common/components/MoreDetailTitle";
import Table from "@sparcs-clubs/web/common/components/Table";
import { useGetClubDetail } from "@sparcs-clubs/web/features/clubs/services/useGetClubDetail";
import { useGetClubMembers } from "@sparcs-clubs/web/features/manage-club/members/services/useGetClubMembers";
import { useGetMyManageClub } from "@sparcs-clubs/web/features/manage-club/services/getMyManageClub";
import useGetSemesterNow from "@sparcs-clubs/web/utils/getSemesterNow";

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

const MemberManageFrame: React.FC = () => {
  // 자신이 대표자인 동아리 clubId 가져오기
  const { data: idData } = useGetMyManageClub() as {
    data: ApiClb015ResponseOk;
    isLoading: boolean;
  };

  const {
    data: membersData,
    isLoading: memberIsLoading,
    isError: memberIsError,
  } = useGetClubMembers({
    clubId: idData.clubId,
    semesterId: 16, // TODO: 현재 학기를 받아와서 수정
  });

  const membersCount = membersData.members.length;

  const table = useReactTable({
    columns,
    data: membersData.members,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // 자신이 대표자인 동아리 clubId에 해당하는 동아리 세부정보 가져오기
  const {
    data: clubData,
    isLoading: clubIsLoading,
    isError: clubIsError,
  } = useGetClubDetail(idData.clubId.toString()) as {
    data: ApiClb002ResponseOK;
    isLoading: boolean;
    isError: boolean;
  };

  const {
    semester: semesterInfo,
    isLoading: semesterLoading,
    isError: semesterError,
  } = useGetSemesterNow();

  const title = `${semesterInfo?.year}년 ${semesterInfo?.name}학기 (총 ${membersCount}명)`;

  return (
    <FoldableSectionTitle title="회원 명단">
      <AsyncBoundary
        isLoading={clubIsLoading || memberIsLoading || semesterLoading}
        isError={clubIsError || memberIsError || semesterError}
      >
        {clubData && membersData && (
          <FlexWrapper direction="column" gap={16}>
            <MoreDetailTitle
              title={title}
              moreDetail="전체 보기"
              moreDetailPath="/manage-club/members"
            />
            <Table table={table} />
          </FlexWrapper>
        )}
      </AsyncBoundary>
    </FoldableSectionTitle>
  );
};

export default MemberManageFrame;
