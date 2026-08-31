"use client";

import { useTranslations } from "next-intl";
import React from "react";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import PastSemesterDashboardSection from "@sparcs-clubs/web/common/components/PastSemesterDashboardSection";
import useGetSemesters from "@sparcs-clubs/web/common/services/getSemesters";
import useGetClubSemesterCounts from "@sparcs-clubs/web/features/clubs/services/useGetClubSemesterCounts";

const PastClubListSection = () => {
  const t = useTranslations("club");
  const semestersQuery = useGetSemesters({
    pageOffset: 1,
    itemCount: 100,
  });
  const countsQuery = useGetClubSemesterCounts();
  const semesterIds = new Set(
    countsQuery.data?.counts
      .filter(({ clubCount }) => clubCount > 0)
      .map(({ semesterId }) => semesterId),
  );
  const semesters = (semestersQuery.data?.semesters ?? []).filter(
    semester =>
      semester.endTerm.getTime() < Date.now() && semesterIds.has(semester.id),
  );

  return (
    <AsyncBoundary
      isLoading={semestersQuery.isLoading || countsQuery.isLoading}
      isError={semestersQuery.isError || countsQuery.isError}
    >
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
