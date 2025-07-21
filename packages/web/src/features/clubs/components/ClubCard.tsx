"use client";

import isPropValid from "@emotion/is-prop-valid";
import { useTranslations } from "next-intl";
import React from "react";
import styled from "styled-components";

// import ScrollingText from "./_atomic/ScrollingText";
import Card from "@sparcs-clubs/web/common/components/Card";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import Icon from "@sparcs-clubs/web/common/components/Icon";
import Tag from "@sparcs-clubs/web/common/components/Tag";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import { useAuth } from "@sparcs-clubs/web/common/providers/AuthContext";
import {
  getClubType,
  getShortClubType,
  getTagColorFromClubType,
} from "@sparcs-clubs/web/features/clubs/constants/clubTypeControl";
import { useLanguage } from "@sparcs-clubs/web/i18n/hooks/useLanguage";
import isStudent from "@sparcs-clubs/web/utils/isStudent";

import { ClubDetail } from "../types";
import ClubRegistrationButtonWrapper from "./_atomic/ClubRegistrationButtonWrapper";

interface ClubCardProps {
  club: ClubDetail;
  isRegistrationPeriod?: boolean;
  isMobile?: boolean;
}

const ClubCardRow = styled.div.withConfig({
  shouldForwardProp: prop => isPropValid(prop),
})<{ isMobile: boolean }>`
  display: flex;
  flex-direction: row;
  gap: 16px;
  justify-content: space-between;
  align-items: center;
`;

const ClubCardLongText = styled(Typography).withConfig({
  shouldForwardProp: prop => isPropValid(prop),
})<{ isMobile: boolean }>`
  width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: ${({ isMobile }) => (isMobile ? "14px" : "16px")};
  line-height: ${({ isMobile }) => (isMobile ? "16px" : "20px")};
`;

const ClubName = styled.div.withConfig({
  shouldForwardProp: prop => isPropValid(prop),
})<{ isMobile: boolean }>`
  flex: 1 0 0;
  width: 100%;
  font-size: ${({ isMobile }) => (isMobile ? "16px" : "20px")};
  line-height: ${({ isMobile }) => (isMobile ? "20px" : "24px")};
  font-weight: ${({ theme }) => theme.fonts.WEIGHT.MEDIUM};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ClubCardNameWithTag = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1 0 0;
  overflow: hidden;
  white-space: nowrap;
`;

const ClubCard: React.FC<ClubCardProps> = ({
  club,
  isRegistrationPeriod = false,
  isMobile = false,
}) => {
  const t = useTranslations();
  const { isLoggedIn, profile } = useAuth();
  const { isEnglish, isLoading } = useLanguage();

  const getClubName = () => {
    if (isLoading) {
      return club.nameKr;
    }
    return isEnglish ? club.nameEn : club.nameKr;
  };

  return (
    <Card gap={isMobile ? 12 : 16} padding="16px 20px">
      <ClubCardRow isMobile={isMobile}>
        <ClubCardNameWithTag>
          {isMobile && (
            <Tag color={getTagColorFromClubType(club.type, club.isPermanent)}>
              {t(`club.${getShortClubType(club)}`)}
            </Tag>
          )}
          <ClubName isMobile={isMobile}>{getClubName()}</ClubName>
          {/* 돌아가는 텍스트를 만들 수 있어요
             <ScrollingText isMobile={isMobile} >{club.nameKr}</ScrollingText> */}
        </ClubCardNameWithTag>
        <FlexWrapper direction="row" gap={4}>
          <Icon type="person" size={16} />
          <Typography fs={14} lh={16}>
            {club.totalMemberCnt}
          </Typography>
        </FlexWrapper>
      </ClubCardRow>
      {!isMobile && (
        <ClubCardLongText isMobile={isMobile}>
          {club.advisor === "null" ||
          club.advisor === "undefined" ||
          club.advisor === undefined ||
          club.advisor === null ||
          club.advisor === ""
            ? `${t("club.회장")} ${club.representative}`
            : `${t("club.회장")} ${club.representative} | ${t("common.지도교수")} ${club.advisor}`}
        </ClubCardLongText>
      )}
      {!isMobile && (
        <ClubCardLongText isMobile={isMobile}>
          {club.characteristic}
        </ClubCardLongText>
      )}
      <ClubCardRow isMobile={isMobile}>
        {!isMobile && (
          <Tag color={getTagColorFromClubType(club.type, club.isPermanent)}>
            {t(`club.${getClubType(club)}`)}
          </Tag>
        )}
        {isMobile && (
          <ClubCardLongText isMobile={isMobile}>
            {club.characteristic}
          </ClubCardLongText>
        )}
        {isRegistrationPeriod && isLoggedIn && isStudent(profile) && (
          <ClubRegistrationButtonWrapper club={club} isMobile={isMobile} />
        )}
      </ClubCardRow>
    </Card>
  );
};
export default ClubCard;
