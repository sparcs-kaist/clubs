"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Suspense } from "react";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import SectionTitle from "@sparcs-clubs/web/common/components/SectionTitle";
import { useAuth } from "@sparcs-clubs/web/common/providers/AuthContext";
import MyClubTable from "@sparcs-clubs/web/features/my/components/MyClubTable";
import { useGetMyClubRegistration } from "@sparcs-clubs/web/features/my/services/getMyClubRegistration";

const PreviousRegistrationList = () => {
  const t = useTranslations("my.overview");
  const { profile } = useAuth();
  const clubIdParam = Number(useSearchParams().get("clubId"));
  const clubId =
    Number.isSafeInteger(clubIdParam) && clubIdParam > 0
      ? clubIdParam
      : undefined;
  const { data, isPending, isFetching, isError } = useGetMyClubRegistration({
    semester: "previous",
    clubId,
    viewerId: profile?.studentId ?? profile?.id,
    refetchOnMount: "always",
  });
  const semesters = data?.semesters ?? [];
  const registrations = data?.registrations ?? [];

  return (
    <AsyncBoundary isLoading={isPending || isFetching} isError={isError}>
      {semesters.length === 0 ? (
        <MyClubTable clubRegisterList={{ registrations: [] }} />
      ) : (
        <FlexWrapper direction="column" gap={40}>
          {semesters.map(semester => (
            <FlexWrapper key={semester.id} direction="column" gap={24}>
              <SectionTitle>
                {t("semester", {
                  year: semester.year,
                  name: semester.name
                    .replace(/^(봄|spring)$/i, t("season.spring"))
                    .replace(/^(여름|summer)$/i, t("season.summer"))
                    .replace(/^(가을|fall)$/i, t("season.fall"))
                    .replace(/^(겨울|winter)$/i, t("season.winter")),
                })}
              </SectionTitle>
              <MyClubTable
                clubRegisterList={{
                  registrations: registrations.filter(
                    registration => registration.semesterId === semester.id,
                  ),
                }}
                detailPath="/my/register-club/previous"
                detailClubId={clubId}
              />
            </FlexWrapper>
          ))}
        </FlexWrapper>
      )}
    </AsyncBoundary>
  );
};

const PreviousRegistrationPage = () => (
  <Suspense fallback={<AsyncBoundary isLoading isError={false} />}>
    <PreviousRegistrationList />
  </Suspense>
);

export default PreviousRegistrationPage;
