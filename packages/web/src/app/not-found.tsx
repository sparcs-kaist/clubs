"use client";

import type { NextPage } from "next";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import ErrorMessage from "@sparcs-clubs/web/common/components/ErrorMessage";
import ErrorPageTemplate from "@sparcs-clubs/web/common/frames/ErrorPageTemplate";

const renderBreak = () => <br />;

const NotFound: NextPage = () => {
  const t = useTranslations("common");
  const Message = (
    <ErrorMessage>{t.rich("notFound", { br: renderBreak })}</ErrorMessage>
  );

  const router = useRouter();

  const goToMain = () => {
    router.push("/");
  };

  return (
    <ErrorPageTemplate
      message={Message}
      buttons={[
        {
          text: t("goToMain"),
          onClick: goToMain,
        },
      ]}
    />
  );
};

export default NotFound;
