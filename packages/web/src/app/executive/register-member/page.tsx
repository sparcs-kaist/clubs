"use client";

import React from "react";

import { UserTypeEnum } from "@sparcs-clubs/interface/common/enum/user.enum";

import Custom404 from "@sparcs-clubs/web/app/not-found";
import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import PageHead from "@sparcs-clubs/web/common/components/PageHead";
import LoginRequired from "@sparcs-clubs/web/common/frames/LoginRequired";
import { useAuth } from "@sparcs-clubs/web/common/providers/AuthContext";
import { ExecutiveRegisterMember } from "@sparcs-clubs/web/features/executive/register-member/frames/ExecutiveRegisterMemberFrame";

/** NOTE: (@dora) 등록 기간 무관하게 항상 볼 수 있는 화면 */
const RegisterMember = () => {
  const { isLoggedIn, login, profile } = useAuth();

  if (!isLoggedIn) {
    return <LoginRequired login={login} />;
  }

  if (profile === null) {
    return <AsyncBoundary isLoading isError={false} />;
  }

  if (profile?.type !== UserTypeEnum.Executive) {
    return <Custom404 />;
  }

  return (
    <FlexWrapper direction="column" gap={20}>
      <PageHead
        items={[
          { name: "집행부원 대시보드", path: "/executive" },
          { name: "회원 등록 신청 내역", path: `/executive/register-member` },
        ]}
        title="회원 등록 신청 내역"
      />
      <ExecutiveRegisterMember />
    </FlexWrapper>
  );
};

export default RegisterMember;
