"use client";

import { useTranslations } from "next-intl";
import React from "react";
import styled from "styled-components";

import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import SectionTitle from "@sparcs-clubs/web/common/components/SectionTitle";
import ClubDetailCard from "@sparcs-clubs/web/features/clubs/components/ClubDetailCard";
import ClubInfoCard from "@sparcs-clubs/web/features/clubs/components/ClubInfoCard";
import ClubMemberCard, {
  ClubDetailFrameProps,
} from "@sparcs-clubs/web/features/clubs/components/ClubMemberCard";

const CardWrapper = styled.div`
  width: 100%;
  padding-left: 20px;

  @media (max-width: ${({ theme }) => theme.responsive.BREAKPOINT.sm}) {
    padding-left: 16px;
  }
`;

const MoreInfoWrapper = styled.div`
  display: flex;
  flex-direction: row;
  gap: 60px;

  @media (max-width: ${({ theme }) => theme.responsive.BREAKPOINT.lg}) {
    flex-direction: column;
  }
`;

const PersonInfoWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: fit-content;
  max-width: 50%;
  @media (max-width: ${({ theme }) => theme.responsive.BREAKPOINT.lg}) {
    width: 100%;
    max-width: 100%;
  }
`;

const ClubDetailInfoFrame: React.FC<ClubDetailFrameProps> = ({
  club,
  isRegistrationPeriod,
}) => {
  const t = useTranslations("club");

  return (
    <>
      <FlexWrapper direction="column" gap={20}>
        <SectionTitle size="lg">{t("동아리 정보")}</SectionTitle>
        <CardWrapper>
          <ClubInfoCard club={club} />
        </CardWrapper>
      </FlexWrapper>
      <MoreInfoWrapper>
        <PersonInfoWrapper>
          <SectionTitle size="lg">{t("인적 사항")}</SectionTitle>
          <CardWrapper>
            <ClubMemberCard
              club={club}
              isRegistrationPeriod={isRegistrationPeriod}
            />
          </CardWrapper>
        </PersonInfoWrapper>
        <FlexWrapper direction="column" gap={20} style={{ flex: "1 0 0" }}>
          <SectionTitle size="lg">{t("동아리 설명")}</SectionTitle>
          <CardWrapper>
            <ClubDetailCard club={club} />
          </CardWrapper>
        </FlexWrapper>
      </MoreInfoWrapper>
    </>
  );
};

export default ClubDetailInfoFrame;
