"use client";

import { useTranslations } from "next-intl";
import React from "react";

import ErrorMessage from "@sparcs-clubs/web/common/components/ErrorMessage";
import ErrorPageTemplate from "@sparcs-clubs/web/common/frames/ErrorPageTemplate";

const renderBreak = () => <br />;

interface LoginRequiredProps {
  login: () => void;
}

const LoginRequired: React.FC<LoginRequiredProps> = ({ login }) => {
  const t = useTranslations("common");
  const Message = (
    <ErrorMessage>{t.rich("loginRequired", { br: renderBreak })}</ErrorMessage>
  );

  return (
    <ErrorPageTemplate
      message={Message}
      buttons={[{ text: t("goToLogin"), onClick: login }]}
    />
  );
};

export default LoginRequired;
