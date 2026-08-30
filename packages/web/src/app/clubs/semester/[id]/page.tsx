"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import React from "react";

import NotFound from "@sparcs-clubs/web/app/not-found";
import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import PageHead from "@sparcs-clubs/web/common/components/PageHead";
import useGetSemesters from "@sparcs-clubs/web/common/services/getSemesters";
import ClubsListFrame from "@sparcs-clubs/web/features/clubs/frames/ClubsListFrame";

const PastClubs = () => {
  const t = useTranslations("club");
  const { id } = useParams<{ id: string }>();
  const semesterId = Number(id);
  const isValidSemesterId = Number.isInteger(semesterId) && semesterId > 0;
  const { data, isLoading, isError } = useGetSemesters({
    pageOffset: 1,
    itemCount: 100,
  });
  const semester = data?.semesters.find(item => item.id === semesterId);

  if (!isValidSemesterId || (!isLoading && !semester)) {
    return <NotFound />;
  }

  return (
    <FlexWrapper direction="column" gap={60}>
      <AsyncBoundary
        isLoading={isLoading}
        isError={isError}
        renderIfError={<NotFound />}
      >
        {semester && (
          <>
            <PageHead
              items={[
                { name: t("동아리 목록"), path: "/clubs" },
                {
                  name: t("학기 동아리 목록", {
                    year: semester.year,
                    name: semester.name,
                  }),
                  path: `/clubs/semester/${semester.id}`,
                },
              ]}
              title={t("학기 동아리 목록", {
                year: semester.year,
                name: semester.name,
              })}
            />
            <ClubsListFrame
              isRegistrationPeriod={false}
              semesterId={semester.id}
            />
          </>
        )}
      </AsyncBoundary>
    </FlexWrapper>
  );
};

export default PastClubs;
