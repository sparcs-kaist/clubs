"use client";

import React from "react";
import styled from "styled-components";

import type { ApiNtc001ResponseOK } from "@clubs/interface/api/notice/endpoint/apiNtc001";

import {
  formatDotDate,
  formatDotSimpleDate,
} from "@sparcs-clubs/web/utils/Date/formatDate";

const NoticeCardInner = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
`;

const NoticeTitle = styled.div`
  color: ${({ theme }) => theme.colors.BLACK};
  font-family: ${({ theme }) => theme.fonts.FAMILY.PRETENDARD};
  font-size: 16px;
  line-height: 20px;
  font-weight: ${({ theme }) => theme.fonts.WEIGHT.MEDIUM};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  @media (max-width: ${({ theme }) => theme.responsive.BREAKPOINT.sm}) {
    font-size: 14px;
    line-height: 16px;
  }
`;

const NoticeDate = styled.div<{ date: Date }>`
  color: ${({ theme }) => theme.colors.BLACK};
  font-family: ${({ theme }) => theme.fonts.FAMILY.PRETENDARD};
  font-size: 16px;
  line-height: 20px;
  font-weight: ${({ theme }) => theme.fonts.WEIGHT.REGULAR};
  white-space: nowrap;

  &::after {
    content: "${({ date }) => formatDotDate(date)}";
  }
  @media (max-width: ${({ theme }) => theme.responsive.BREAKPOINT.sm}) {
    font-size: 14px;
    line-height: 16px;
    &::after {
      content: "${({ date }) => formatDotSimpleDate(date)}";
    }
  }
`;

const NoticeCard: React.FC<{
  noticeList: ApiNtc001ResponseOK["notices"][number];
}> = ({ noticeList }) => (
  <NoticeCardInner>
    <NoticeTitle>{noticeList.title}</NoticeTitle>
    <NoticeDate date={noticeList.date} />
  </NoticeCardInner>
);

export default NoticeCard;
