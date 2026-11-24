"use client";

import React from "react";

import { ClubDelegateEnum } from "@clubs/interface/common/enum/club.enum";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import FoldableSectionTitle from "@sparcs-clubs/web/common/components/FoldableSectionTitle";
import PageHead from "@sparcs-clubs/web/common/components/PageHead";
import NoManageClub from "@sparcs-clubs/web/common/frames/NoManageClub";
import NoSemesterInfo from "@sparcs-clubs/web/common/frames/NoSemesterInfo";
import useGetClubRegistrationDeadline from "@sparcs-clubs/web/features/clubs/services/useGetClubRegistrationDeadline";
import ActivityManageFrame from "@sparcs-clubs/web/features/manage-club/frames/ActivityManageFrame";
import ClubRegistrationApplicationsFrame from "@sparcs-clubs/web/features/manage-club/frames/ClubRegistrationApplicationsFrame";
import InfoManageFrame from "@sparcs-clubs/web/features/manage-club/frames/InfoManageFrame";
import MemberManageFrame from "@sparcs-clubs/web/features/manage-club/frames/MemberManageFrame";
// import ServiceManageFrame from "@sparcs-clubs/web/features/manage-club/frames/ServiceManageFrame";
import RegistrationManageFrame from "@sparcs-clubs/web/features/manage-club/frames/RegistrationManageFrame";
import ClubRentalOrders from "@sparcs-clubs/web/features/rental-business/components/ClubRentalOrders";
import {
  RentalActions,
  RentalLink,
} from "@sparcs-clubs/web/features/rental-business/components/RentalFields";
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
      {clubId && <ClubRegistrationApplicationsFrame clubId={clubId} />}
      {clubId && (
        <section id="rental-business" aria-label="대여 신청">
          <FoldableSectionTitle title="대여 신청">
            <FlexWrapper direction="column" gap={16}>
              <RentalActions>
                <RentalLink href="/rental-business">물품 대여 신청</RentalLink>
              </RentalActions>
              <ClubRentalOrders clubId={clubId} />
            </FlexWrapper>
          </FoldableSectionTitle>
        </section>
      )}
      {/* <ServiceManageFrame /> */}
    </FlexWrapper>
  );
};

export default ManageClubFrame;
