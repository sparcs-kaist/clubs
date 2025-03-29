"use client";

import { useEffect, useState } from "react";

import { UserTypeEnum } from "@sparcs-clubs/interface/common/enum/user.enum";

import NotFound from "@sparcs-clubs/web/app/not-found";
import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import PageHead from "@sparcs-clubs/web/common/components/PageHead";
import LoginRequired from "@sparcs-clubs/web/common/frames/LoginRequired";
import NotForExecutive from "@sparcs-clubs/web/common/frames/NotForExecutive";
import { useAuth } from "@sparcs-clubs/web/common/providers/AuthContext";
import MyRegisterClubDetailFrame from "@sparcs-clubs/web/features/register-club/frames/MyRegisterClubDetailFrame";

const MyRegisterClubDetail = () => {
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

  if (profile?.type === UserTypeEnum.Executive) {
    return <NotForExecutive />;
  }

  if (!profile) {
    return <NotFound />;
  }

  return (
    <FlexWrapper direction="column" gap={40}>
      <PageHead
        items={[
          { name: "마이페이지", path: "/my" },
          {
            name: "동아리 등록",
            path: "/my/register-club",
          },
        ]}
        title="동아리 등록"
      />
      <MyRegisterClubDetailFrame profile={profile.type as UserTypeEnum} />
    </FlexWrapper>
  );
};
export default MyRegisterClubDetail;
