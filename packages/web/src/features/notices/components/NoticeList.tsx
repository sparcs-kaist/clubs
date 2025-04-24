"use client";

import Link from "next/link";
import React from "react";
import styled from "styled-components";

import type { ApiNtc001ResponseOK } from "@clubs/interface/api/notice/endpoint/apiNtc001";

import NoticeListItem from "@sparcs-clubs/web/features/notices/components/NoticeListItem";

interface NoticeListProps {
  infos: ApiNtc001ResponseOK["notices"];
}

const NoticeListInner = styled.div`
  width: 100%;
  flex-grow: 1;
  flex-shrink: 1;
  overflow: hidden;
  border-bottom: 1px solid;
  border-color: ${({ theme }) => theme.colors.GRAY[200]};
  display: flex;
  flex-direction: column;
`;

const NoticeListItemWrapper = styled(Link)`
  flex-grow: 0;
  min-height: 48px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.GRAY[200]};
  padding: 8px;
  display: flex;
  overflow: hidden;
  align-items: center;
`;

const NoticeList: React.FC<NoticeListProps> = ({ infos }) => (
  <NoticeListInner>
    {infos.map(noticeInfo => (
      <NoticeListItemWrapper
        key={noticeInfo.id}
        href={noticeInfo.link}
        target="_blank"
        rel="noopener noreferrer"
      >
        <NoticeListItem title={noticeInfo.title} date={noticeInfo.date} />
      </NoticeListItemWrapper>
    ))}
  </NoticeListInner>
);

export default NoticeList;

export type { NoticeListProps };
