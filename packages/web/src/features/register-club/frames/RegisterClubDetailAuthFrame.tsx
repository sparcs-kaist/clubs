"use client";

import { UserTypeEnum } from "@clubs/interface/common/enum/user.enum";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import RegisterClubDetailFrame from "@sparcs-clubs/web/features/register-club/frames/RegisterClubDetailFrame";

import useGetRegisterClubDetail from "../services/useGetRegisterClubDetail";

const RegisterClubDetailAuthFrame = ({
  profile,
  applyId,
}: {
  profile: UserTypeEnum | "permanent";
  applyId: number;
}) => {
  const {
    data: clubDetail,
    isLoading,
    isError,
  } = useGetRegisterClubDetail(
    profile === "permanent" ? UserTypeEnum.Undergraduate : profile,
    { applyId },
  );

  return (
    <AsyncBoundary isLoading={isLoading} isError={isError}>
      <RegisterClubDetailFrame profile={profile} clubDetail={clubDetail!} />
    </AsyncBoundary>
  );
};

export default RegisterClubDetailAuthFrame;
