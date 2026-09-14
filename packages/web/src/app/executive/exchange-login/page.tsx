"use client";

import { UserTypeEnum } from "@clubs/interface/common/enum/user.enum";

import NotFound from "@sparcs-clubs/web/app/not-found";
import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import PageHead from "@sparcs-clubs/web/common/components/PageHead";
import LoginRequired from "@sparcs-clubs/web/common/frames/LoginRequired";
import { useAuth } from "@sparcs-clubs/web/common/providers/AuthContext";
import ExchangeLoginFrame from "@sparcs-clubs/web/features/executive/frames/ExchangeLoginFrame";

const ExecutiveExchangeLogin = () => {
  const { isLoggedIn, login, profile } = useAuth();

  if (isLoggedIn && profile === undefined) {
    return <AsyncBoundary isLoading isError={false} />;
  }
  if (!isLoggedIn) return <LoginRequired login={login} />;
  if (profile?.type !== UserTypeEnum.Executive) return <NotFound />;

  return (
    <FlexWrapper direction="column" gap={32}>
      <PageHead
        items={[
          { name: "집행부원 대시보드", path: "/executive" },
          { name: "로그인 갈아끼우기", path: "/executive/exchange-login" },
        ]}
        title="로그인 갈아끼우기"
      />
      <ExchangeLoginFrame />
    </FlexWrapper>
  );
};

export default ExecutiveExchangeLogin;
