"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import React from "react";
import styled from "styled-components";

import SectionTitle from "@sparcs-clubs/web/common/components/SectionTitle";

const MoreSectionTitleInner = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
`;

const MoreInfo = styled.div`
  font-family: ${({ theme }) => theme.fonts.FAMILY.PRETENDARD};
  font-size: 14px;
  line-height: 20px;
  font-weight: ${({ theme }) => theme.fonts.WEIGHT.REGULAR};
  color: ${({ theme }) => theme.colors.BLACK};
  text-decoration-line: underline;
  cursor: pointer;
`;

const MoreSectionTitle: React.FC<{
  title: string;
  path?: string;
}> = ({ title, path }) => {
  const t = useTranslations();
  return (
    <MoreSectionTitleInner>
      <SectionTitle size="sm">{title}</SectionTitle>
      {path && (
        <Link href={path!} style={{ display: "flex", flexDirection: "column" }}>
          <MoreInfo>{t("common.view_more")}</MoreInfo>
        </Link>
      )}
    </MoreSectionTitleInner>
  );
};

export default MoreSectionTitle;
