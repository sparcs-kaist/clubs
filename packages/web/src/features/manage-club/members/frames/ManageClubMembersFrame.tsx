"use client";

import React from "react";

import { ApiClb015ResponseOk } from "@clubs/interface/api/club/endpoint/apiClb015";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import PageHead from "@sparcs-clubs/web/common/components/PageHead";
import NoManageClub from "@sparcs-clubs/web/common/frames/NoManageClub";
import AllMemberListFrame from "@sparcs-clubs/web/features/manage-club/members/frames/AllMemberListFrame";
import RegisterMemberListFrame from "@sparcs-clubs/web/features/manage-club/members/frames/RegisterMemberListFrame";
import { useGetMyManageClub } from "@sparcs-clubs/web/features/manage-club/services/getMyManageClub";
import { useCheckManageClub } from "@sparcs-clubs/web/hooks/checkManageClub";

const ManageClubMembers: React.FC = () => {
  const { delegate, isLoading } = useCheckManageClub();
  const { data: clubData } = useGetMyManageClub() as {
    data: ApiClb015ResponseOk;
  };

  if (isLoading) {
    return <AsyncBoundary isLoading={isLoading} isError />;
  }

  if (delegate === undefined) {
    return <NoManageClub />;
  }

  return (
    <FlexWrapper direction="column" gap={60}>
      <PageHead
        items={[
          { name: "대표 동아리 관리", path: "/manage-club" },
          { name: "회원 명단", path: "/manage-club/members" },
        ]}
        title="회원 명단"
      />
      <RegisterMemberListFrame />
      {clubData && <AllMemberListFrame clubId={clubData.clubId} />}
    </FlexWrapper>
  );
};

export default ManageClubMembers;
