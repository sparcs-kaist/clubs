"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import PageHead from "@sparcs-clubs/web/common/components/PageHead";
import LoginRequired from "@sparcs-clubs/web/common/frames/LoginRequired";
import NoPermission from "@sparcs-clubs/web/common/frames/NoPermission";
import { useAuth } from "@sparcs-clubs/web/common/providers/AuthContext";
import isStudent from "@sparcs-clubs/web/utils/isStudent";

const PreviousRegistrationLayout = ({ children }: { children: ReactNode }) => {
  const t = useTranslations("registrationHistory");
  const myT = useTranslations("my.registration");
  const { isLoggedIn, login, profile } = useAuth();

  if (!isLoggedIn) return <LoginRequired login={login} />;
  if (!isStudent(profile)) return <NoPermission />;

  return (
    <FlexWrapper direction="column" gap={40}>
      <PageHead
        items={[
          { name: myT("myPage"), path: "/my" },
          { name: t("title"), path: "/my/register-club/previous" },
        ]}
        title={t("title")}
      />
      {children}
    </FlexWrapper>
  );
};

export default PreviousRegistrationLayout;
