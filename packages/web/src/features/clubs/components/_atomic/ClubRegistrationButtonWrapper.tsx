"use client";

import React from "react";

import { RegistrationApplicationStudentStatusEnum } from "@clubs/interface/common/enum/registration.enum";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import useGetMyRegistration from "@sparcs-clubs/web/features/clubs/hooks/useGetMyRegistration";
import { ClubDetail } from "@sparcs-clubs/web/features/clubs/types";

import ClubRegistrationButton from "../ClubRegistrationButton";

interface ClubRegistrationButtonWrapperProps {
  club: ClubDetail;
  isMobile?: boolean;
}

const ClubRegistrationButtonWrapper: React.FC<
  ClubRegistrationButtonWrapperProps
> = ({ club, isMobile = false }) => {
  const {
    data: { registrationStatus, isRegistered, registrations },
    isLoading,
    isError,
  } = useGetMyRegistration(club.id);

  return (
    <AsyncBoundary isLoading={isLoading} isError={isError}>
      <ClubRegistrationButton
        club={club}
        isInClub={
          registrationStatus ===
          RegistrationApplicationStudentStatusEnum.Approved
        }
        isRegistered={isRegistered}
        isMobile={isMobile}
        myRegistrationList={registrations}
      />
    </AsyncBoundary>
  );
};
export default ClubRegistrationButtonWrapper;
