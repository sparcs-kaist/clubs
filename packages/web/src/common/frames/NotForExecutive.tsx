"use client";

import type { NextPage } from "next";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import ErrorMessage from "@sparcs-clubs/web/common/components/ErrorMessage";
import ErrorPageTemplate from "@sparcs-clubs/web/common/frames/ErrorPageTemplate";

const renderBreak = () => <br />;

const NotForExecutive: NextPage = () => {
  const t = useTranslations("common");
  const router = useRouter();

  const Message = (
    <ErrorMessage>
      {t.rich("notForExecutive", { br: renderBreak })}
    </ErrorMessage>
  );

  const goToMain = () => {
    router.push("/");
  };

  return (
    <ErrorPageTemplate
      message={Message}
      buttons={[{ text: t("goToMain"), onClick: goToMain }]}
    />
  );
};

export default NotForExecutive;
