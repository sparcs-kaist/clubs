"use client";

import React from "react";
import styled from "styled-components";

interface ClubInfoItemProps {
  title: string;
  content: React.ReactNode;
}

const ClubInfoItemInner = styled.div`
  display: flex;
  flex-direction: row;
  gap: 40px;
  @media (max-width: ${({ theme }) => theme.responsive.BREAKPOINT.sm}) {
    gap: 12px;
  }
  font-size: 16px;
  line-height: 24px;
`;

const ClubInfoTitle = styled(ClubInfoItemInner)`
  font-weight: ${({ theme }) => theme.fonts.WEIGHT.MEDIUM};
  width: 120px;
  @media (max-width: ${({ theme }) => theme.responsive.BREAKPOINT.sm}) {
    width: 28px;
    font-size: 14px;
    line-height: 20px;
  }
  white-space: nowrap;
  justify-content: center;
`;

const ClubInfoContent = styled(ClubInfoItemInner)`
  font-weight: ${({ theme }) => theme.fonts.WEIGHT.REGULAR};
  @media (max-width: ${({ theme }) => theme.responsive.BREAKPOINT.sm}) {
    font-size: 14px;
    line-height: 20px;
  }
  flex: 1;
`;

const ClubInfoItem: React.FC<ClubInfoItemProps> = ({ title, content }) => (
  <ClubInfoItemInner>
    <ClubInfoTitle>{title}</ClubInfoTitle>
    <ClubInfoContent>{content}</ClubInfoContent>
  </ClubInfoItemInner>
);

export default ClubInfoItem;
