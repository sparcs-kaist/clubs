"use client";

import { useTranslations } from "next-intl";
import React, { useMemo } from "react";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import ClubsSectionFrame from "@sparcs-clubs/web/features/clubs/frames/ClubsSectionFrame";
import useGetMyClubProfessor from "@sparcs-clubs/web/features/my/clubs/service/getMyClubProfessor";

const MyClubsProfessorFrame: React.FC = () => {
  const t = useTranslations("my.overview");
  const { data, isLoading, isError } = useGetMyClubProfessor();
  const isMyClubsExist = useMemo(
    () => (data?.semesters ?? []).length > 0,
    [data],
  );
  return (
    <AsyncBoundary isLoading={isLoading} isError={isError}>
      {isMyClubsExist ? (
        <FlexWrapper direction="column" gap={60}>
          {(data?.semesters ?? []).map(
            myClub =>
              myClub.clubs.length > 0 && (
                <ClubsSectionFrame
                  showLength={false}
                  title={myClub.name
                    .replace("봄", t("season.spring"))
                    .replace("여름", t("season.summer"))
                    .replace("가을", t("season.fall"))
                    .replace("겨울", t("season.winter"))}
                  clubList={myClub.clubs}
                  key={myClub.name}
                />
              ),
          )}
        </FlexWrapper>
      ) : (
        <Typography color="GRAY.300" fs={20} fw="MEDIUM">
          {t("noClubs")}
        </Typography>
      )}
    </AsyncBoundary>
  );
};

export default MyClubsProfessorFrame;
