"use client";

import React from "react";

import { ClubDelegateEnum } from "@clubs/interface/common/enum/club.enum";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import PageHead from "@sparcs-clubs/web/common/components/PageHead";
import NoManageClub from "@sparcs-clubs/web/common/frames/NoManageClub";
import NoSemesterInfo from "@sparcs-clubs/web/common/frames/NoSemesterInfo";
import useGetClubRegistrationDeadline from "@sparcs-clubs/web/features/clubs/services/useGetClubRegistrationDeadline";
import ActivityManageFrame from "@sparcs-clubs/web/features/manage-club/frames/ActivityManageFrame";
import InfoManageFrame from "@sparcs-clubs/web/features/manage-club/frames/InfoManageFrame";
import MemberManageFrame from "@sparcs-clubs/web/features/manage-club/frames/MemberManageFrame";
// import ServiceManageFrame from "@sparcs-clubs/web/features/manage-club/frames/ServiceManageFrame";
import RegistrationManageFrame from "@sparcs-clubs/web/features/manage-club/frames/RegistrationManageFrame";
import { useCheckManageClub } from "@sparcs-clubs/web/hooks/checkManageClub";

const ManageClubFrame: React.FC = () => {
  const { delegate, clubId, isLoading } = useCheckManageClub();

  const {
    data,
    isLoading: isLoadingDeadline,
    isError: isErrorDeadline,
  } = useGetClubRegistrationDeadline();

  if (isLoading) {
    return (
      <AsyncBoundary
        isLoading={isLoading || isLoadingDeadline}
        isError={isErrorDeadline}
      />
    );
  }

  if (delegate === undefined) {
    return <NoManageClub />;
  }

  if (data == null) {
    return <NoSemesterInfo />;
  }

  return (
    <FlexWrapper direction="column" gap={60}>
      <PageHead
        items={[{ name: "대표 동아리 관리", path: "/manage-club" }]}
        title="대표 동아리 관리"
      />
      <InfoManageFrame
        isRepresentative={delegate === ClubDelegateEnum.Representative}
        clubId={clubId || 0}
      />
      <ActivityManageFrame />
      {data?.deadline ? (
        <RegistrationManageFrame />
      ) : (
        <MemberManageFrame semesterInfo={data.semester} />
      )}
      {/* <ServiceManageFrame /> */}
    </FlexWrapper>
  );
};

export default ManageClubFrame;
