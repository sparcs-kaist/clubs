"use client";

import { hangulIncludes } from "es-hangul";
import { useTranslations } from "next-intl";
import React, { useMemo, useState } from "react";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import SearchInput from "@sparcs-clubs/web/common/components/SearchInput";
import useEasterEgg from "@sparcs-clubs/web/common/hooks/useEasteregg";
import ClubsSectionFrame from "@sparcs-clubs/web/features/clubs/frames/ClubsSectionFrame";
import { useGetClubsList } from "@sparcs-clubs/web/features/clubs/services/useGetClubsList";

interface ClubsListProps {
  isRegistrationPeriod: boolean;
}

const ClubsListFrame: React.FC<ClubsListProps> = ({ isRegistrationPeriod }) => {
  // 이스터에그_리크루팅
  useEasterEgg();
  const t = useTranslations();

  const { data, isLoading, isError } = useGetClubsList();

  const [searchText, setSearchText] = useState<string>("");

  const filteredDivisions = useMemo(
    () =>
      (data?.divisions ?? [])
        .map(division => {
          const filteredClubs = division.clubs
            .filter(
              item =>
                item.nameKr.toLowerCase().includes(searchText.toLowerCase()) ||
                item.nameEn.toLowerCase().includes(searchText.toLowerCase()) ||
                hangulIncludes(item.nameKr, searchText),
            )
            .sort((a, b) => {
              if (a.isPermanent && !b.isPermanent) return -1;
              if (!a.isPermanent && b.isPermanent) return 1;
              return a.type - b.type || a.nameKr.localeCompare(b.nameKr);
            });

          return { ...division, clubs: filteredClubs };
        })
        .filter(division => division.clubs.length > 0),
    [data, searchText],
  );

  return (
    <AsyncBoundary isLoading={isLoading} isError={isError}>
      {filteredDivisions.length > 0 && (
        <SearchInput
          searchText={searchText}
          handleChange={setSearchText}
          placeholder={t("club.placeholder")}
        />
      )}
      <FlexWrapper direction="column" gap={40}>
        {filteredDivisions.map(division => (
          <ClubsSectionFrame
            title={t(`division.${division.name}`)}
            clubList={division.clubs}
            key={division.name}
            isRegistrationPeriod={isRegistrationPeriod}
          />
        ))}
      </FlexWrapper>
    </AsyncBoundary>
  );
};

export default ClubsListFrame;
