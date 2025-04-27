"use client";

import { useEffect, useState } from "react";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import PageHead from "@sparcs-clubs/web/common/components/PageHead";
import LoginRequired from "@sparcs-clubs/web/common/frames/LoginRequired";
import { useAuth } from "@sparcs-clubs/web/common/providers/AuthContext";
import { ExecutiveRegistrationClubFrame } from "@sparcs-clubs/web/features/executive/register-club/frames/ExecutiveRegistrationClubFrame";

// TODO. 동아리등록 내역이 심사를 위해 모든 학생이 볼 수 있어야 한다고 해서 잠시 집행부쪽 코드 복붙함,
// 나중에 디자이너와 함께 새로운 진입경로 추가 리팩토링 해야 함
const ClubRegistration = () => {
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

  return (
    <FlexWrapper direction="column" gap={20}>
      <PageHead
        items={[
          { name: "동아리 등록 신청 내역", path: `/executive/register-club` },
        ]}
        title="동아리 등록 신청 내역"
      />
      <ExecutiveRegistrationClubFrame />
    </FlexWrapper>
  );
};

export default ClubRegistration;
