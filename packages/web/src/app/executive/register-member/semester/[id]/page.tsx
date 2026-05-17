"use client";

import { useParams } from "next/navigation";
import React from "react";

import { UserTypeEnum } from "@clubs/interface/common/enum/user.enum";

import NotFound from "@sparcs-clubs/web/app/not-found";
import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import PageHead from "@sparcs-clubs/web/common/components/PageHead";
import LoginRequired from "@sparcs-clubs/web/common/frames/LoginRequired";
import { useAuth } from "@sparcs-clubs/web/common/providers/AuthContext";
import { ExecutiveRegisterMember } from "@sparcs-clubs/web/features/executive/register-member/frames/ExecutiveRegisterMemberFrame";

const ExecutiveRegisterMemberSemester = () => {
  const { isLoggedIn, login, profile } = useAuth();
  const { id } = useParams<{ id: string }>();

  const parsedSemesterId = Number(id);
  const isValidSemesterId =
    Number.isInteger(parsedSemesterId) && parsedSemesterId > 0;

  if (!isLoggedIn) {
    return <LoginRequired login={login} />;
  }

  if (profile === null) {
    return <AsyncBoundary isLoading isError={false} />;
  }

  if (profile?.type !== UserTypeEnum.Executive || !isValidSemesterId) {
    return <NotFound />;
  }

  return (
    <FlexWrapper direction="column" gap={20}>
      <PageHead
        items={[
          { name: "집행부원 대시보드", path: "/executive" },
          { name: "회원 등록 신청 내역", path: "/executive/register-member" },
        ]}
        title="회원 등록 신청 내역"
        enableLast
      />
      <ExecutiveRegisterMember semesterId={parsedSemesterId} />
    </FlexWrapper>
  );
};

export default ExecutiveRegisterMemberSemester;
