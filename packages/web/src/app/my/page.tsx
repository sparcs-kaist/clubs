"use client";

import React, { useEffect, useState } from "react";
import styled from "styled-components";

import { UserTypeEnum } from "@clubs/interface/common/enum/user.enum";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import PageHead from "@sparcs-clubs/web/common/components/PageHead";
import LoginRequired from "@sparcs-clubs/web/common/frames/LoginRequired";
import { useAuth } from "@sparcs-clubs/web/common/providers/AuthContext";
import Banner from "@sparcs-clubs/web/features/landing/components/Banner";
import { MyChangesFrame } from "@sparcs-clubs/web/features/my/frames/MyChangesFrame";
import MyClubFrame from "@sparcs-clubs/web/features/my/frames/MyClubFrame";
import MyInfoFrame from "@sparcs-clubs/web/features/my/frames/MyInfoFrame";
import MyRegisterFrame from "@sparcs-clubs/web/features/my/frames/MyRegisterFrame";
import ProfessorMyClubFrame from "@sparcs-clubs/web/features/my/frames/ProfessorMyClubFrame";
// import isStudent from "@sparcs-clubs/web/utils/isStudent";
// import MyServiceFrame from "@sparcs-clubs/web/features/my/frames/MyServiceFrame";

const ResponsiveWrapper = styled(FlexWrapper)`
  @media (max-width: ${({ theme }) => theme.responsive.BREAKPOINT.md}) {
    gap: 40px;
  }
`;

const My: React.FC = () => {
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
    <ResponsiveWrapper direction="column" gap={60}>
      <PageHead
        items={[{ name: "마이페이지", path: "/my" }]}
        title="마이페이지"
      />
      {profile?.type === UserTypeEnum.Professor && (
        <Banner icon="warning">
          동아리 등록 신청서는 이 페이지 하단에서 확인하실 수 있으며, 동아리
          등록 신청서는 학기 역순으로 정렬되어 있습니다.
          <br />
          표에 나와있는 승인 상태는 지도교수님 승인 상태와는 별개이므로, 실제
          승인 상태는 동아리 등록 신청서에서 확인하실 수 있습니다.
        </Banner>
      )}
      {profile?.type === UserTypeEnum.Undergraduate && <MyChangesFrame />}
      <MyInfoFrame profile={profile?.type as string} />
      {profile?.type !== UserTypeEnum.Executive &&
        (profile?.type === UserTypeEnum.Professor ? (
          <ProfessorMyClubFrame />
        ) : (
          <MyClubFrame />
        ))}
      {profile && profile.type !== UserTypeEnum.Executive && (
        <MyRegisterFrame profile={profile.type} />
      )}
      {/* {isStudent(profile) && <MyServiceFrame />} */}
    </ResponsiveWrapper>
  );
};

export default My;
