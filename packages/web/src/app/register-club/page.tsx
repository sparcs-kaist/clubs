"use client";

import React, { useEffect, useState } from "react";

import { UserTypeEnum } from "@clubs/interface/common/enum/user.enum";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import ErrorMessage from "@sparcs-clubs/web/common/components/ErrorMessage";
import ErrorPageTemplate from "@sparcs-clubs/web/common/frames/ErrorPageTemplate";
import LoginRequired from "@sparcs-clubs/web/common/frames/LoginRequired";
import NoManageClubForExecutive from "@sparcs-clubs/web/common/frames/NoManageClubForExecutive";
import NoRegisterClubForProfessor from "@sparcs-clubs/web/common/frames/NoRegisterClubForProfessor";
import { useAuth } from "@sparcs-clubs/web/common/providers/AuthContext";
import RegisterClubFrame from "@sparcs-clubs/web/features/register-club/frames/RegisterClubFrame";

const RegisterClub: React.FC = () => {
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

  if (profile?.type === UserTypeEnum.Professor) {
    return <NoRegisterClubForProfessor />;
  }

  if (profile?.type === UserTypeEnum.Executive) {
    return <NoManageClubForExecutive />;
  }

  if (profile?.type !== UserTypeEnum.Undergraduate) {
    return (
      <ErrorPageTemplate
        message={
          <ErrorMessage>
            학부생만 동아리 등록을 신청할 수 있습니다.
          </ErrorMessage>
        }
      />
    );
  }

  return <RegisterClubFrame />;
};

export default RegisterClub;
