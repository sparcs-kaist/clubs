"use client";

import { useTranslations } from "next-intl";
import React, { useEffect, useState } from "react";

import { UserTypeEnum } from "@clubs/interface/common/enum/user.enum";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import PageHead from "@sparcs-clubs/web/common/components/PageHead";
import LoginRequired from "@sparcs-clubs/web/common/frames/LoginRequired";
import NotForExecutive from "@sparcs-clubs/web/common/frames/NotForExecutive";
import { useAuth } from "@sparcs-clubs/web/common/providers/AuthContext";
import MyClubsMainFrame from "@sparcs-clubs/web/features/my/clubs/frames/MyClubsMainFrame";
import MyClubsProfessorFrame from "@sparcs-clubs/web/features/my/clubs/frames/MyClubsProfessorFrame";

const MyClubs = () => {
  const t = useTranslations("path");
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

  return (
    <FlexWrapper direction="column" gap={60}>
      <PageHead
        items={[
          { name: t("마이페이지"), path: "/my" },
          { name: t("나의 동아리"), path: "/my/clubs" },
        ]}
        title={t("나의 동아리")}
      />
      {profile?.type === UserTypeEnum.Professor ? (
        <MyClubsProfessorFrame />
      ) : (
        <MyClubsMainFrame />
      )}
    </FlexWrapper>
  );
};

export default MyClubs;
