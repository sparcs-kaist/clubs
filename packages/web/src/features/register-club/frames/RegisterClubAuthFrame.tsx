import React, { useMemo } from "react";

import { RegistrationTypeEnum } from "@sparcs-clubs/interface/common/enum/registration.enum";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import HasClubRegistration from "@sparcs-clubs/web/common/frames/HasClubRegistration";
import NoManageClub from "@sparcs-clubs/web/common/frames/NoManageClub";
import NotRegistrationPeriod from "@sparcs-clubs/web/common/frames/NotClubRegistrationPeriod";
import useGetClubRegistrationDeadline from "@sparcs-clubs/web/features/clubs/services/useGetClubRegistrationDeadline";
import { useGetMyClubRegistration } from "@sparcs-clubs/web/features/my/services/getMyClubRegistration";
import RegisterClubMainFrame from "@sparcs-clubs/web/features/register-club/frames/RegisterClubMainFrame";
import { useCheckManageClub } from "@sparcs-clubs/web/hooks/checkManageClub";

import useGetAvailableRegistrationInfo from "../hooks/useGetAvailableRegistrationInfo";

const RegisterClubAuthFrame: React.FC<{
  type: RegistrationTypeEnum;
}> = ({ type }) => {
  const { delegate, isLoading: checkLoading } = useCheckManageClub();

  const {
    data: myClubRegistrationData,
    isLoading,
    isError,
  } = useGetMyClubRegistration();

  const {
    data: availableRegistrationInfo,
    isLoading: isLoadingAvailableRegistrationInfo,
    isError: isErrorAvailableRegistrationInfo,
  } = useGetAvailableRegistrationInfo();

  const {
    data: clubDeadline,
    isLoading: isLoadingDeadline,
    isError: isErrorDeadline,
  } = useGetClubRegistrationDeadline();

  const hasMyClubRegistration = useMemo<boolean>(
    () =>
      myClubRegistrationData
        ? myClubRegistrationData.registrations.length > 0
        : false,
    [myClubRegistrationData],
  );

  const canRegisterClub = useMemo<boolean>(() => {
    if (availableRegistrationInfo) {
      if (
        availableRegistrationInfo.noManageClub &&
        type === RegistrationTypeEnum.NewProvisional
      ) {
        return true;
      }

      if (availableRegistrationInfo.haveAvailableRegistration && type) {
        if (
          type === RegistrationTypeEnum.NewProvisional &&
          availableRegistrationInfo.availableRegistrations.includes(
            RegistrationTypeEnum.ReProvisional,
          )
        ) {
          return true;
        }

        return availableRegistrationInfo.availableRegistrations.includes(type);
      }
    }

    return false;
  }, [availableRegistrationInfo, type]);

  if (
    isLoading ||
    checkLoading ||
    isLoadingDeadline ||
    isLoadingAvailableRegistrationInfo
  ) {
    return (
      <AsyncBoundary
        isLoading={
          isLoading ||
          checkLoading ||
          isLoadingDeadline ||
          isLoadingAvailableRegistrationInfo
        }
        isError={isError || isErrorDeadline || isErrorAvailableRegistrationInfo}
      />
    );
  }

  if (delegate === undefined && type !== RegistrationTypeEnum.NewProvisional) {
    return <NoManageClub />;
  }

  if (hasMyClubRegistration) {
    return (
      <HasClubRegistration
        applyId={myClubRegistrationData!.registrations[0].id}
      />
    );
  }

  if (!canRegisterClub) {
    return (
      <HasClubRegistration
        errorMessage={`관리하고 있는 동아리의 동아리 신청 내역이 존재하거나 \n 동아리 등록 신청 조건에 만족하지 않아 신청할 수 없습니다.`}
      />
    );
  }

  if (clubDeadline?.deadline == null) {
    return <NotRegistrationPeriod />;
  }

  return (
    <RegisterClubMainFrame
      type={type}
      deadline={clubDeadline.deadline.endTerm}
    />
  );
};

export default RegisterClubAuthFrame;
