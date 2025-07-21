"use client";

import { useTranslations } from "next-intl";
import React from "react";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import PageHead from "@sparcs-clubs/web/common/components/PageHead";
import { ClubDetailProps } from "@sparcs-clubs/web/features/clubs/components/ClubDetailCard";
import { RegisterInfo } from "@sparcs-clubs/web/features/clubs/components/RegisterInfo";
import useGetMyRegistration from "@sparcs-clubs/web/features/clubs/hooks/useGetMyRegistration";
import useGetMemberRegistrationDeadline from "@sparcs-clubs/web/features/clubs/services/useGetMemberRegistrationDeadline";

import ClubDetailInfoFrame from "./ClubDetailInfoFrame";

const ClubDetailStudentFrame: React.FC<ClubDetailProps> = ({ club }) => {
  const t = useTranslations("club");
  const {
    data: { registrationStatus, isRegistered, registrations },
    isLoading,
    isError,
  } = useGetMyRegistration(club.id);

  const {
    data,
    isLoading: isLoadingDeadline,
    isError: isErrorDeadline,
  } = useGetMemberRegistrationDeadline();

  return (
    <AsyncBoundary
      isLoading={isLoading || isLoadingDeadline}
      isError={isError || isErrorDeadline}
    >
      <FlexWrapper direction="column" gap={60}>
        <PageHead
          items={[
            { name: t("동아리 목록"), path: "/clubs" },
            { name: club.nameKr, path: `/clubs/${club.id}` },
          ]}
          title={club.nameKr}
          action={
            data?.deadline && (
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
          isRegistrationPeriod={data?.deadline != null}
        />
      </FlexWrapper>
    </AsyncBoundary>
  );
};

export default ClubDetailStudentFrame;
