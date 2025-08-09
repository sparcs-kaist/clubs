"use client";

import { useTranslations } from "next-intl";
import React from "react";
import styled from "styled-components";

import type { ApiClb002ResponseOK } from "@clubs/interface/api/club/endpoint/apiClb002";

import Card from "@sparcs-clubs/web/common/components/Card";

export interface ClubDetailProps {
  club: ApiClb002ResponseOK;
}

const ClubDetailText = styled.div`
  width: 100%;
  font-size: 16px;
  line-height: 28px;
  @media (max-width: ${({ theme }) => theme.responsive.BREAKPOINT.sm}) {
    font-size: 14px;
    line-height: 20px;
  }
  font-weight: 400;
`;

const EmptyDetailText = styled.div`
  width: 100%;
  font-size: 16px;
  line-height: 28px;
  font-weight: 400;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  color: ${({ theme }) => theme.colors.GRAY[300]};
`;

const ClubDetailCard: React.FC<ClubDetailProps> = ({ club }) => {
  const t = useTranslations();

  return (
    <Card gap={16} padding="16px 20px" style={{ flexGrow: "1" }}>
      {club.description ? (
        <ClubDetailText>{club.description}</ClubDetailText>
      ) : (
        <EmptyDetailText>{t("club.동아리 설명 없음")}</EmptyDetailText>
      )}
    </Card>
  );
};

export default ClubDetailCard;
