import { useParams } from "next/navigation";
import React from "react";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import { useGetMyClubRegistration } from "@sparcs-clubs/web/features/my/services/getMyClubRegistration";
import useRegisterClubDetail from "@sparcs-clubs/web/features/register-club/hooks/useGetRegisterClubDetail";

import MyRegisterClubDetailFrame from "./MyRegisterClubDetailFrame";

const StudentRegisterClubDetailFrame: React.FC<{ userType: string }> = ({
  userType,
}) => {
  const { id } = useParams();

  const {
    data: clubDetail,
    isLoading,
    isError,
  } = useRegisterClubDetail("undergraduate", { applyId: +id });

  const {
    data: myClubRegistrationData,
    isLoading: isLoadingMyClubRegistration,
    isError: isErrorMyClubRegistration,
  } = useGetMyClubRegistration();

  return (
    <AsyncBoundary
      isLoading={isLoading || isLoadingMyClubRegistration}
      isError={isError || isErrorMyClubRegistration}
    >
      {clubDetail && (
        <MyRegisterClubDetailFrame
          userType={userType}
          clubDetail={clubDetail}
          isMyRegistration={
            myClubRegistrationData &&
            myClubRegistrationData?.registrations.length > 0
          }
        />
      )}
    </AsyncBoundary>
  );
};

export default StudentRegisterClubDetailFrame;
