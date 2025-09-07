"use client";

import { useTranslations } from "next-intl";
import React, { useEffect, useState } from "react";
import styled, { useTheme } from "styled-components";

import type { ApiClb002ResponseOK } from "@clubs/interface/api/club/endpoint/apiClb002";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import Card from "@sparcs-clubs/web/common/components/Card";
import Tag from "@sparcs-clubs/web/common/components/Tag";
import useGetDivisionType from "@sparcs-clubs/web/common/hooks/useGetDivisionType";
import {
  getTagColorFromClubType,
  getTagContentFromClubType,
} from "@sparcs-clubs/web/types/clubdetail.types";

import ClubInfoItem from "./ClubInfoItem";

export interface ClubInfoCardProps {
  club: ApiClb002ResponseOK;
}

const ClubInfoRow = styled.div`
  display: flex;
  flex-direction: row;
  gap: 16px;
  justify-content: space-between;
  width: 100%;
  @media (max-width: ${({ theme }) => theme.responsive.BREAKPOINT.sm}) {
    gap: 8px;
  }
  > * {
    flex: 1;
  }
`;

const ResponsiveClubInfoRow = styled.div`
  display: flex;
  flex-direction: row;
  gap: 16px;

  @media (max-width: ${({ theme }) => theme.responsive.BREAKPOINT.sm}) {
    gap: 8px;
    flex-direction: column;
  }
  > * {
    flex: 1;
  }
`;

const ResponsiveClubCard = styled(Card)`
  gap: 16px;
  @media (max-width: ${({ theme }) => theme.responsive.BREAKPOINT.sm}) {
    gap: 8px;
  }
`;

const ClubInfoCard: React.FC<ClubInfoCardProps> = ({ club }) => {
  const t = useTranslations();
  const theme = useTheme();
  const [isMobile, setIsMobile] = useState(false);

  const { data: divisionData, isLoading, isError } = useGetDivisionType();

  useEffect(() => {
    const mediaQuery = window.matchMedia(
      `(max-width: ${theme.responsive.BREAKPOINT.sm})`,
    );

    // Check the initial state
    setIsMobile(mediaQuery.matches);

    // Set up an event listener to update the state when the window resizes
    const handleResize = () => setIsMobile(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleResize);

    // Clean up the event listener on component unmount
    return () => mediaQuery.removeEventListener("change", handleResize);
  }, [theme]);

  return (
    <ResponsiveClubCard padding="16px 20px">
      <ClubInfoRow>
        <ClubInfoItem
          title={isMobile ? t("club.지위") : t("club.동아리 지위")}
          content={
            <Tag color={getTagColorFromClubType(club.type, club.isPermanent)}>
              {t(
                `club.${getTagContentFromClubType(
                  club.type,
                  club.isPermanent,
                )}`,
              )}
            </Tag>
          }
        />
        <AsyncBoundary isLoading={isLoading} isError={isError}>
          <ClubInfoItem
            title={isMobile ? t("club.분과") : t("club.소속 분과")}
            content={
              <Tag
                color={divisionData?.divisionTagList[club.division.id]?.color}
              >
                {t(`division.${club.division.name}`)}
              </Tag>
            }
          />
        </AsyncBoundary>
      </ClubInfoRow>
      <ResponsiveClubInfoRow>
        <ClubInfoItem
          title={isMobile ? t("club.Charac") : t("club.성격")}
          content={club.characteristic}
        />
        <ClubInfoItem
          title={isMobile ? t("club.연도") : t("club.설립연도")}
          content={`${club.foundingYear}년`}
        />
      </ResponsiveClubInfoRow>
      <ClubInfoItem
        title={isMobile ? t("club.동방") : t("club.동아리방")}
        content={club.room ? club.room : "-"}
      />
    </ResponsiveClubCard>
  );
};

export default ClubInfoCard;
