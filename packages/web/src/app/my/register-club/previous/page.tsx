"use client";

import { useTranslations } from "next-intl";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import SectionTitle from "@sparcs-clubs/web/common/components/SectionTitle";
import { useAuth } from "@sparcs-clubs/web/common/providers/AuthContext";
import MyClubTable from "@sparcs-clubs/web/features/my/components/MyClubTable";
import { useGetMyClubRegistration } from "@sparcs-clubs/web/features/my/services/getMyClubRegistration";

const PreviousRegistrationList = () => {
  const t = useTranslations("my.overview");
  const { profile } = useAuth();
  const { data, isPending, isFetching, isError } = useGetMyClubRegistration({
    semester: "previous",
    viewerId: profile?.studentId ?? profile?.id,
    refetchOnMount: "always",
  });
  const semester = data?.semester;

  return (
    <AsyncBoundary isLoading={isPending || isFetching} isError={isError}>
      {semester && (
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
      )}
      <MyClubTable
        clubRegisterList={data ?? { registrations: [] }}
        detailPath="/my/register-club/previous"
      />
    </AsyncBoundary>
  );
};

export default PreviousRegistrationList;
