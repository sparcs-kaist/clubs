"use client";

import { useTranslations } from "next-intl";
import React from "react";

import useGetClubRegistrationDeadline from "@sparcs-clubs/web/features/clubs/services/useGetClubRegistrationDeadline";
import Banner from "@sparcs-clubs/web/features/landing/components/Banner";

const ProfessorRegistrationBanner: React.FC = () => {
  const t = useTranslations("my.overview");
  const {
    data: clubRegistrationData,
    isLoading,
    isError,
  } = useGetClubRegistrationDeadline();

  if (isLoading || isError) return null;

  // deadline이 존재할 때만 배너 표시
  if (!clubRegistrationData?.deadline) {
    return null;
  }

  return (
    <Banner icon="warning">
      {t("professorBannerLocation")}
      <br />
      {t("professorBannerStatus")}
    </Banner>
  );
};

export default ProfessorRegistrationBanner;
