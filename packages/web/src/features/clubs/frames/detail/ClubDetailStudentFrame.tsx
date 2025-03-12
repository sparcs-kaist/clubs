"use client";

import React from "react";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import PageHead from "@sparcs-clubs/web/common/components/PageHead";
import { ClubDetailProps } from "@sparcs-clubs/web/features/clubs/components/ClubDetailCard";
import { RegisterInfo } from "@sparcs-clubs/web/features/clubs/components/RegisterInfo";
import useGetMemberRegistrationPeriod from "@sparcs-clubs/web/features/clubs/hooks/useGetMemberRegistrationPeriod";
import useGetMyRegistration from "@sparcs-clubs/web/features/clubs/hooks/useGetMyRegistration";

import ClubDetailInfoFrame from "./ClubDetailInfoFrame";

const ClubDetailStudentFrame: React.FC<ClubDetailProps> = ({ club }) => {
  const {
    data: { registrationStatus, isRegistered, registrations },
    isLoading,
    isError,
  } = useGetMyRegistration(club.id);

  const {
    data: { isMemberRegistrationPeriod },
    isLoading: isLoadingTerm,
    isError: isErrorTerm,
  } = useGetMemberRegistrationPeriod();

  return (
    <AsyncBoundary
      isLoading={isLoading || isLoadingTerm}
      isError={isError || isErrorTerm}
    >
      <FlexWrapper direction="column" gap={60}>
        <PageHead
          items={[
            { name: "동아리 목록", path: "/clubs" },
            { name: club.nameKr, path: `/clubs/${club.id}` },
          ]}
          title={club.nameKr}
          action={
            isMemberRegistrationPeriod && (
              <RegisterInfo
                club={club}
                registrationStatus={registrationStatus}
                isRegistered={isRegistered}
                myRegistrationList={registrations}
              />
            )
          }
        />
        <ClubDetailInfoFrame
          club={club}
          isRegistrationPeriod={isMemberRegistrationPeriod}
        />
      </FlexWrapper>
    </AsyncBoundary>
  );
};

export default ClubDetailStudentFrame;
