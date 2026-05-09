"use client";

import React, { useEffect, useState } from "react";

import { UserTypeEnum } from "@clubs/interface/common/enum/user.enum";

import Custom404 from "@sparcs-clubs/web/app/not-found";
import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import PageHead from "@sparcs-clubs/web/common/components/PageHead";
import LoginRequired from "@sparcs-clubs/web/common/frames/LoginRequired";
import { useAuth } from "@sparcs-clubs/web/common/providers/AuthContext";
import { RegistrationClubFrame } from "@sparcs-clubs/web/features/permanent/register-club/frames/RegistrationClubFrame";

const PermanentClubRepresentativeRegisterClub = () => {
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
    return <Custom404 />;
  }

  return (
    <FlexWrapper direction="column" gap={20}>
      <PageHead
        items={[
          { name: "대표 동아리 관리", path: "/manage-club" },
          {
            name: "상임동아리 대표자 대시보드",
            path: "/manage-club/permanent",
          },
          {
            name: "동아리 등록 신청 내역",
            path: "/manage-club/permanent/register-club",
          },
        ]}
        title="동아리 등록 신청 내역"
      />
      <RegistrationClubFrame />
    </FlexWrapper>
  );
};

export default PermanentClubRepresentativeRegisterClub;
