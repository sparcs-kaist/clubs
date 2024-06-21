"use client";

import React from "react";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";

import ClubsSectionFrame from "@sparcs-clubs/web/features/clubs/frames/ClubsSectionFrame";
import { useGetClubsList } from "@sparcs-clubs/web/features/clubs/services/useGetClubsList";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";

const ClubsPageMainFrame: React.FC = () => {
  const { data, isLoading, isError } = useGetClubsList();
  return (
    <FlexWrapper direction="column" gap={60}>
      <AsyncBoundary isLoading={isLoading} isError={isError}>
        <FlexWrapper direction="column" gap={40}>
          {(data?.divisions ?? []).map(division => (
            <ClubsSectionFrame
              title={division.name}
              clubList={division.clubs.sort((a, b) => {
                if (a.isPermanent && !b.isPermanent) return -1;
                if (!a.isPermanent && b.isPermanent) return 1;
                return a.type - b.type || a.name.localeCompare(b.name);
              })}
              key={division.name}
            />
          ))}
        </FlexWrapper>
      </AsyncBoundary>
    </FlexWrapper>
  );
};

export default ClubsPageMainFrame;
