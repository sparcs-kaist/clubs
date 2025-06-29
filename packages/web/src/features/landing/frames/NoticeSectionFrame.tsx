"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import React from "react";
import styled from "styled-components";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import {
  noticeItemCount,
  noticePageOffset,
} from "@sparcs-clubs/web/constants/mainPage";
import paths from "@sparcs-clubs/web/constants/paths";
import { useGetNotice } from "@sparcs-clubs/web/features/notices/services/useGetNotice";

import MoreSectionTitle from "../components/MoreSectionTitle";
import NoticeCard from "../components/NoticeCard";

const NoticeSectionFrameInner = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 16px;
  overflow: hidden;
`;

const NoticeWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-left: 24px;
  @media (max-width: ${({ theme }) => theme.responsive.BREAKPOINT.sm}) {
    margin-left: 16px;
    gap: 16px;
  }
`;

const NoticeLastUpdateTime = styled.div`
  font-family: ${({ theme }) => theme.fonts.FAMILY.PRETENDARD};
  margin-left: 24px;
  font-size: 14px;
  line-height: 20px;
  font-weight: ${({ theme }) => theme.fonts.WEIGHT.REGULAR};
  color: ${({ theme }) => theme.colors.BLACK};
`;

const NoticeSectionFrame: React.FC = () => {
  const { data, isLoading, isError } = useGetNotice(
    noticePageOffset,
    noticeItemCount,
  );

  const t = useTranslations();

  return (
    <AsyncBoundary isLoading={isLoading} isError={isError}>
      <NoticeSectionFrameInner>
        <MoreSectionTitle title={t("common.notice")} path={paths.NOTICE.path} />
        <NoticeLastUpdateTime>
          last update: {data?.lastUpdateTime.toLocaleDateString()}{" "}
          {data?.lastUpdateTime.toLocaleTimeString()}
        </NoticeLastUpdateTime>
        <NoticeWrapper>
          {data?.notices.map(noticeInfo => (
            <Link
              key={noticeInfo.id}
              href={
                noticeInfo.link
              } /* TODO - 각 notice에 따른 올바른 path로 수정 바람 --> paths.NOTICE.path + "/" + noticeInfo.id.toString() */
              style={{ display: "flex", flexDirection: "column" }}
              target="_blank"
              rel="noopener noreferrer"
            >
              <NoticeCard noticeList={noticeInfo} />
            </Link>
          ))}
        </NoticeWrapper>
      </NoticeSectionFrameInner>
    </AsyncBoundary>
  );
};

export default NoticeSectionFrame;
