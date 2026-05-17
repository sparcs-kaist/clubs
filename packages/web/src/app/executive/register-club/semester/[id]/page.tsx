"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { UserTypeEnum } from "@clubs/interface/common/enum/user.enum";

import NotFound from "@sparcs-clubs/web/app/not-found";
import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import PageHead from "@sparcs-clubs/web/common/components/PageHead";
import LoginRequired from "@sparcs-clubs/web/common/frames/LoginRequired";
import { useAuth } from "@sparcs-clubs/web/common/providers/AuthContext";
import { ExecutiveRegistrationClubFrame } from "@sparcs-clubs/web/features/executive/register-club/frames/ExecutiveRegistrationClubFrame";

const ExecutiveRegisterClubSemester = () => {
  const { isLoggedIn, login, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const { id } = useParams<{ id: string }>();

  const parsedSemesterId = Number(id);
  const isValidSemesterId =
    Number.isInteger(parsedSemesterId) && parsedSemesterId > 0;

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

  if (profile?.type !== UserTypeEnum.Executive || !isValidSemesterId) {
    return <NotFound />;
  }

  return (
    <FlexWrapper direction="column" gap={20}>
      <PageHead
        items={[
          { name: "집행부원 대시보드", path: "/executive" },
          { name: "동아리 등록 신청 내역", path: "/executive/register-club" },
        ]}
        title="동아리 등록 신청 내역"
        enableLast
      />
      <ExecutiveRegistrationClubFrame
        url="/executive/register-club"
        semesterId={parsedSemesterId}
      />
    </FlexWrapper>
  );
};

export default ExecutiveRegisterClubSemester;
