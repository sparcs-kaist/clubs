"use client";

import { useTranslations } from "next-intl";
import React from "react";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import PastSemesterDashboardSection from "@sparcs-clubs/web/common/components/PastSemesterDashboardSection";
import useGetSemesters from "@sparcs-clubs/web/common/services/getSemesters";

const PastClubListSection = () => {
  const t = useTranslations("club");
  const { data, isLoading, isError } = useGetSemesters({
    pageOffset: 1,
    itemCount: 100,
  });
  const semesters = (data?.semesters ?? []).filter(
    semester => semester.endTerm.getTime() < Date.now(),
  );

  return (
    <AsyncBoundary isLoading={isLoading} isError={isError}>
      <PastSemesterDashboardSection
        title={t("과거 동아리 목록")}
        emptyMessage={t("과거 동아리 목록 없음")}
        semesters={semesters}
        rowLink={semester => `/clubs/semester/${semester.id}`}
      />
    </AsyncBoundary>
  );
};

export default PastClubListSection;
