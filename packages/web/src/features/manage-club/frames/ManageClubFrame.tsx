"use client";

import React, { useEffect, useState } from "react";

import { ClubDelegateEnum } from "@sparcs-clubs/interface/common/enum/club.enum";
import { RegistrationDeadlineEnum } from "@sparcs-clubs/interface/common/enum/registration.enum";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import PageHead from "@sparcs-clubs/web/common/components/PageHead";
import NoManageClub from "@sparcs-clubs/web/common/frames/NoManageClub";
import { useGetRegistrationTerm } from "@sparcs-clubs/web/features/clubs/services/useGetRegistrationTerm";
import ActivityManageFrame from "@sparcs-clubs/web/features/manage-club/frames/ActivityManageFrame";
import InfoManageFrame from "@sparcs-clubs/web/features/manage-club/frames/InfoManageFrame";
import MemberManageFrame from "@sparcs-clubs/web/features/manage-club/frames/MemberManageFrame";
// import ServiceManageFrame from "@sparcs-clubs/web/features/manage-club/frames/ServiceManageFrame";
import RegistrationManageFrame from "@sparcs-clubs/web/features/manage-club/frames/RegistrationManageFrame";
import { useCheckManageClub } from "@sparcs-clubs/web/hooks/checkManageClub";

const ManageClubFrame: React.FC = () => {
  const { delegate, clubId, isLoading } = useCheckManageClub();

  const { data, isLoading: termIsLoading } = useGetRegistrationTerm();
  const [isRegistrationPeriod, setIsRegistrationPeriod] =
    useState<boolean>(false);

  useEffect(() => {
    if (data) {
      const now = new Date();
      const currentEvents = data.events.filter(
        event =>
          now >= new Date(event.startTerm) && now <= new Date(event.endTerm),
      );
      if (currentEvents.length === 0) {
        setIsRegistrationPeriod(false);
        return;
      }
      const registrationEvent = currentEvents.filter(
        event =>
          event.registrationEventEnumId ===
          RegistrationDeadlineEnum.StudentRegistrationApplication,
      );
      if (registrationEvent.length > 0) {
        setIsRegistrationPeriod(true);
      } else {
        setIsRegistrationPeriod(false);
      }
    }
  }, [data]);

  if (isLoading || termIsLoading) {
    return <AsyncBoundary isLoading={isLoading || termIsLoading} isError />;
  }

  if (delegate === undefined) {
    return <NoManageClub />;
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
      {isRegistrationPeriod ? (
        <RegistrationManageFrame />
      ) : (
        <MemberManageFrame />
      )}

      {/* <ServiceManageFrame /> */}
    </FlexWrapper>
  );
};

export default ManageClubFrame;
