"use client";

import { UserTypeEnum } from "@clubs/interface/common/enum/user.enum";

import NotFound from "@sparcs-clubs/web/app/not-found";
import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import PageHead from "@sparcs-clubs/web/common/components/PageHead";
import LoginRequired from "@sparcs-clubs/web/common/frames/LoginRequired";
import { useAuth } from "@sparcs-clubs/web/common/providers/AuthContext";
import RegistrationDelegateChangeFrame from "@sparcs-clubs/web/features/executive/register-club/frames/RegistrationDelegateChangeFrame";

const ExecutiveRegistrationDelegateChange = () => {
  const { isLoggedIn, login, profile } = useAuth();
  const isAuthLoading =
    isLoggedIn === undefined || (isLoggedIn && profile === undefined);

  if (isAuthLoading) return <AsyncBoundary isLoading isError={false} />;
  if (!isLoggedIn) return <LoginRequired login={login} />;
  if (profile?.type !== UserTypeEnum.Executive) return <NotFound />;

  return (
    <FlexWrapper direction="column" gap={20}>
      <PageHead
        items={[
          { name: "집행부원 대시보드", path: "/executive" },
          {
            name: "동아리 등록기간 중 대표자 변경",
            path: "/executive/register-club/delegate-change",
          },
        ]}
        title="동아리 등록기간 중 대표자 변경"
      />
      <RegistrationDelegateChangeFrame />
    </FlexWrapper>
  );
};

export default ExecutiveRegistrationDelegateChange;
