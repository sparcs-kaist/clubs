"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";

import { UserTypeEnum } from "@clubs/interface/common/enum/user.enum";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import Button from "@sparcs-clubs/web/common/components/Button";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import PageHead from "@sparcs-clubs/web/common/components/PageHead";
import LoginRequired from "@sparcs-clubs/web/common/frames/LoginRequired";
import { useAuth } from "@sparcs-clubs/web/common/providers/AuthContext";
import RegisterClubDetailAuthFrame from "@sparcs-clubs/web/features/register-club/frames/RegisterClubDetailAuthFrame";

// TODO. 동아리등록 내역이 심사를 위해 모든 학생이 볼 수 있어야 한다고 해서 잠시 집행부쪽 코드 복붙함,
// 나중에 디자이너와 함께 새로운 진입경로 추가 리팩토링 해야 함

const ClubRegistrationDetail: React.FC = () => {
  const { isLoggedIn, login, profile } = useAuth();
  const [loading, setLoading] = useState(true);

  const { id: applyId } = useParams();

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
    <FlexWrapper gap={40} direction="column">
      <PageHead
        items={[{ name: "동아리 등록 신청 내역", path: "/club-registration" }]}
        title="동아리 등록 신청 내역"
        enableLast
      />
      <RegisterClubDetailAuthFrame
        applyId={+applyId}
        profile={UserTypeEnum.Executive}
      />
      <Link href="/club-registration">
        <Button>목록으로 돌아가기</Button>
      </Link>
    </FlexWrapper>
  );
};

export default ClubRegistrationDetail;
