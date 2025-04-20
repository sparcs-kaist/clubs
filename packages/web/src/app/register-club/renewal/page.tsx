"use client";

import { useEffect, useState } from "react";

import { RegistrationTypeEnum } from "@clubs/interface/common/enum/registration.enum";
import { UserTypeEnum } from "@clubs/interface/common/enum/user.enum";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import LoginRequired from "@sparcs-clubs/web/common/frames/LoginRequired";
import NoManageClub from "@sparcs-clubs/web/common/frames/NoManageClub";
import { useAuth } from "@sparcs-clubs/web/common/providers/AuthContext";
import RegisterClubAuthFrame from "@sparcs-clubs/web/features/register-club/frames/RegisterClubAuthFrame";

const RenewalRegisterClub = () => {
  const { isLoggedIn, login, profile } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoggedIn !== undefined || profile !== undefined) {
      setLoading(false);
    }
  }, [isLoggedIn, profile]);

  if (loading) {
    return <AsyncBoundary isLoading={loading} isError />;
  }

  if (!isLoggedIn) {
    return <LoginRequired login={login} />;
  }

  if (profile?.type !== UserTypeEnum.Undergraduate) {
    return <NoManageClub />;
  }
  return <RegisterClubAuthFrame type={RegistrationTypeEnum.Renewal} />;
};

export default RenewalRegisterClub;
