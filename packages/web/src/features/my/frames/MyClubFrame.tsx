import { useTranslations } from "next-intl";
import React from "react";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import FoldableSectionTitle from "@sparcs-clubs/web/common/components/FoldableSectionTitle";
import MoreDetailTitle from "@sparcs-clubs/web/common/components/MoreDetailTitle";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import ClubListGrid from "@sparcs-clubs/web/features/clubs/components/ClubListGrid";
import useGetMyClub from "@sparcs-clubs/web/features/my/clubs/service/useGetMyClub";
import useGetSemesterNow from "@sparcs-clubs/web/utils/getSemesterNow";

const MyClubFrame: React.FC = () => {
  const t = useTranslations("my.overview");
  const pathT = useTranslations("path");
  const { data, isLoading, isError } = useGetMyClub();
  const {
    semester: semesterInfo,
    isLoading: semesterLoading,
    isError: semesterError,
  } = useGetSemesterNow();

  return (
    <FoldableSectionTitle title={pathT("나의 동아리")}>
      <AsyncBoundary
        isLoading={isLoading || semesterLoading}
        isError={isError || semesterError}
      >
        <FlexWrapper direction="column" gap={20}>
          <MoreDetailTitle
            title={t("semester", {
              year: semesterInfo?.year ?? "",
              name: (semesterInfo?.name ?? "")
                .replace("봄", t("season.spring"))
                .replace("여름", t("season.summer"))
                .replace("가을", t("season.fall"))
                .replace("겨울", t("season.winter")),
            })}
            moreDetail={t("viewAll")}
            moreDetailPath="/my/clubs"
          />
          {data &&
          data.semesters.length > 0 &&
          (
            data.semesters.find(semester => semester.id === semesterInfo?.id)
              ?.clubs ?? []
          ).length > 0 ? (
            <ClubListGrid
              clubList={
                data.semesters.find(
                  semester => semester.id === semesterInfo?.id,
                )?.clubs ?? []
              }
            />
          ) : (
            <Typography color="GRAY.300" fs={16} fw="MEDIUM">
              {t("noClubsThisSemester")}
            </Typography>
          )}
        </FlexWrapper>
      </AsyncBoundary>
    </FoldableSectionTitle>
  );
};

export default MyClubFrame;
