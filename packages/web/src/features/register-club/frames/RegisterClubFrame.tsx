"use client";

import { useRouter } from "next/navigation";
import React, { useCallback, useMemo, useState } from "react";
import styled from "styled-components";

import { RegistrationTypeEnum } from "@sparcs-clubs/interface/common/enum/registration.enum";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import Button from "@sparcs-clubs/web/common/components/Button";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import Info from "@sparcs-clubs/web/common/components/Info";
import PageHead from "@sparcs-clubs/web/common/components/PageHead";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import WarningInfo from "@sparcs-clubs/web/common/components/WarningInfo";
import useGetClubRegistrationDeadline from "@sparcs-clubs/web/features/clubs/services/useGetClubRegistrationDeadline";
import { useGetMyClubRegistration } from "@sparcs-clubs/web/features/my/services/getMyClubRegistration";
import ClubButton from "@sparcs-clubs/web/features/register-club/components/ClubButton";
import {
  registerClubDeadlineInfoText,
  registerClubOptions,
} from "@sparcs-clubs/web/features/register-club/constants";

import useGetAvailableRegistrationInfo from "../hooks/useGetAvailableRegistrationInfo";

const ClubButtonWrapper = styled.div`
  display: flex;
  align-items: center;
  align-self: stretch;
  flex: 1 0 0;
  gap: 20px;
  @media (max-width: ${({ theme }) => theme.responsive.BREAKPOINT.lg}) {
    flex-direction: column;
  }
`;

const RegisterClubFrame: React.FC = () => {
  const router = useRouter();

  const [selectedType, setSelectedType] = useState<RegistrationTypeEnum | null>(
    null,
  );

  const {
    data: myClubRegistrationData,
    isLoading: isLoadingMyClubRegistration,
    isError: isErrorMyClubRegistration,
  } = useGetMyClubRegistration();

  const {
    data: availableRegistrationInfo,
    isLoading,
    isError,
  } = useGetAvailableRegistrationInfo();

  const {
    data: clubDeadline,
    isLoading: isLoadingDeadline,
    isError: isErrorDeadline,
  } = useGetClubRegistrationDeadline();

  const onClickRegisterClub = useCallback(() => {
    if (selectedType === RegistrationTypeEnum.Renewal)
      router.push(`register-club/renewal`);
    else if (selectedType === RegistrationTypeEnum.Promotional)
      router.push(`register-club/promotional`);
    else {
      router.push(`register-club/provisional`);
    }
  }, [selectedType]);

  const showWarningInfoLinkedText = useMemo(
    () =>
      myClubRegistrationData && myClubRegistrationData.registrations.length > 0,
    [myClubRegistrationData],
  );

  const canRegisterClub = useMemo<boolean>(() => {
    if (availableRegistrationInfo) {
      if (
        availableRegistrationInfo.noManageClub &&
        selectedType === RegistrationTypeEnum.NewProvisional
      ) {
        return true;
      }

      if (availableRegistrationInfo.haveAvailableRegistration && selectedType) {
        if (
          selectedType === RegistrationTypeEnum.NewProvisional &&
          availableRegistrationInfo.availableRegistrations.includes(
            RegistrationTypeEnum.ReProvisional,
          )
        ) {
          return true;
        }

        return availableRegistrationInfo.availableRegistrations.includes(
          selectedType,
        );
      }
    }

    return false;
  }, [availableRegistrationInfo, selectedType]);

  const isRegisterButtonDisabled =
    selectedType === null || !canRegisterClub || clubDeadline?.deadline == null;

  return (
    <FlexWrapper direction="column" gap={60}>
      <PageHead
        items={[{ name: "동아리 등록", path: "/register-club" }]}
        title="동아리 등록"
      />
      <AsyncBoundary
        isLoading={isLoading || isLoadingMyClubRegistration}
        isError={isError || isErrorMyClubRegistration}
      >
        {selectedType && !canRegisterClub && (
          <WarningInfo
            linkText={
              showWarningInfoLinkedText ? "동아리 등록 신청 내역 바로가기" : ""
            }
            onClickLink={() =>
              router.push(
                `my/register-club/${myClubRegistrationData?.registrations[0].id}`,
              )
            }
          >
            <Typography fs={16} lh={24}>
              관리하는 동아리의 동아리 등록 신청 내역이 이미 존재하거나 등록
              신청 조건에 만족하지 않아 신청할 수 없습니다.
            </Typography>
          </WarningInfo>
        )}
      </AsyncBoundary>
      <AsyncBoundary isLoading={isLoadingDeadline} isError={isErrorDeadline}>
        {clubDeadline?.deadline ? (
          <Info
            text={registerClubDeadlineInfoText(
              clubDeadline.deadline.endDate,
              clubDeadline.semester,
            )}
          />
        ) : (
          <Info text="현재는 동아리 등록 기간이 아닙니다" />
        )}
      </AsyncBoundary>
      <ClubButtonWrapper>
        {registerClubOptions.map(({ type, title, buttonText }) => (
          <ClubButton
            key={type}
            title={title}
            buttonText={buttonText}
            selected={selectedType === type}
            onClick={() => setSelectedType(type)}
          />
        ))}
      </ClubButtonWrapper>
      <Button
        type={isRegisterButtonDisabled ? "disabled" : "default"}
        onClick={onClickRegisterClub}
        style={{ alignSelf: "end" }}
      >
        등록 신청
      </Button>
    </FlexWrapper>
  );
};

export default RegisterClubFrame;
