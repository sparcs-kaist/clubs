"use client";

import { useTranslations } from "next-intl";
import React from "react";
import styled from "styled-components";

import type { ApiClb002ResponseOK } from "@clubs/interface/api/club/endpoint/apiClb002";

import Card from "@sparcs-clubs/web/common/components/Card";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import Typography from "@sparcs-clubs/web/common/components/Typography";

export interface ClubDetailFrameProps {
  club: ApiClb002ResponseOK;
  isRegistrationPeriod: boolean;
}

const StyledCard = styled(Card)`
  width: fit-content;
  max-width: 100%;
  padding: 16px 20px !important;
  gap: 40px;
  flex-direction: row;
  @media (max-width: 1200px) {
    width: 100%;
    max-width: 100%;
  }
`;

const TitleWrapper = styled(FlexWrapper)`
  width: 120px;
  flex-direction: column;
  gap: 16px;
  justify-content: center;
  align-items: center;
  @media (max-width: ${({ theme }) => theme.responsive.BREAKPOINT.sm}) {
    width: 106px;
  }
`;
const ContentsWrapper = styled(FlexWrapper)`
  display: flex;
  width: 100%;
  min-width: 120px;
  flex-direction: column;
  gap: 16px;
  justify-content: center;
  align-items: center;
`;

const Title = styled(Typography)`
  font-weight: ${({ theme }) => theme.fonts.WEIGHT.MEDIUM};
  font-size: 16px;
  line-height: 24px;
  text-align: center;
  @media (max-width: ${({ theme }) => theme.responsive.BREAKPOINT.sm}) {
    font-size: 14px;
    line-height: 20px;
  }
`;

const Contents = styled(Typography)`
  font-weight: ${({ theme }) => theme.fonts.WEIGHT.REGULAR};
  @media (max-width: ${({ theme }) => theme.responsive.BREAKPOINT.sm}) {
    font-size: 14px;
    line-height: 20px;
    width: 100%;
  }
  width: 100%;
  text-overflow: ellipsis;
  text-align: center;
  overflow: hidden;
  white-space: nowrap;
  display: block;
  flex-grow: 1;
  min-width: 0;
  position: relative;
`;

const ClubMemberCard: React.FC<ClubDetailFrameProps> = ({
  club,
  isRegistrationPeriod,
}) => {
  const t = useTranslations();

  return (
    <StyledCard>
      <TitleWrapper direction="column" gap={16}>
        <Title>{t("club.총원")}</Title>
        <Title>{t("club.대표자")}</Title>
        <Title>{t("common.지도교수")}</Title>
      </TitleWrapper>
      <ContentsWrapper direction="column" gap={16}>
        <Contents>
          {isRegistrationPeriod
            ? "-"
            : `${club.totalMemberCnt} ${t("common.명")}`}
        </Contents>
        <Contents>{club.representative}</Contents>
        <Contents>
          {!club.advisor ||
          club.advisor === "null" ||
          club.advisor === "undefined"
            ? "-"
            : club.advisor}
        </Contents>
      </ContentsWrapper>
    </StyledCard>
  );
};

export default ClubMemberCard;
