"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";

import { UserTypeEnum } from "@clubs/interface/common/enum/user.enum";

import Custom404 from "@sparcs-clubs/web/app/not-found";
import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import Button from "@sparcs-clubs/web/common/components/Button";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import PageHead from "@sparcs-clubs/web/common/components/PageHead";
import LoginRequired from "@sparcs-clubs/web/common/frames/LoginRequired";
import { useAuth } from "@sparcs-clubs/web/common/providers/AuthContext";
import ClubRegisterApproveFrame from "@sparcs-clubs/web/features/executive/register-club/frames/ClubRegisterApproveFrame";
import RegisterClubDetailAuthFrame from "@sparcs-clubs/web/features/register-club/frames/RegisterClubDetailAuthFrame";

const RegisterClubDetail: React.FC = () => {
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

  if (profile?.type !== UserTypeEnum.Executive) {
    return <Custom404 />;
  }

  return (
    <FlexWrapper gap={40} direction="column">
      <PageHead
        items={[
          { name: "집행부원 대시보드", path: "/executive" },
          { name: "동아리 등록 신청 내역", path: "/executive/register-club" },
        ]}
        title="동아리 등록 신청 내역"
        enableLast
      />
      <RegisterClubDetailAuthFrame
        applyId={+applyId}
        profile={UserTypeEnum.Executive}
      />
      <ClubRegisterApproveFrame applyId={+applyId} />
      <Link href="/executive/register-club">
        <Button>목록으로 돌아가기</Button>
      </Link>
    </FlexWrapper>
  );
};

export default RegisterClubDetail;
