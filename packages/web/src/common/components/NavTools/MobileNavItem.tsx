"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import React from "react";
import styled from "styled-components";

import Icon from "../Icon";

interface MobileNavItemProps {
  name: string;
  path?: string;
  isExpanded?: boolean;
  highlight?: boolean;
  onClick?: VoidFunction;
}

const MobileNavItemInner = styled.div<{ highlight?: boolean }>`
  display: flex;
  padding: 4px 12px;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  align-self: stretch;

  font-family: ${({ theme }) => theme.fonts.FAMILY.PRETENDARD};
  font-size: 16px;
  line-height: 20px;
  font-weight: ${({ highlight, theme }) =>
    highlight ? theme.fonts.WEIGHT.SEMIBOLD : theme.fonts.WEIGHT.MEDIUM};
  color: ${({ highlight, theme }) =>
    highlight ? theme.colors.PRIMARY : theme.colors.BLACK};

  cursor: pointer;

  &:hover {
    font-weight: ${({ theme }) => theme.fonts.WEIGHT.SEMIBOLD};
  }
`;

const MobileNavItem: React.FC<MobileNavItemProps> = ({
  name,
  path = "",
  isExpanded = false,
  highlight = false,
  onClick = () => {},
}) => {
  const t = useTranslations();

  return (
    <MobileNavItemInner highlight={highlight} onClick={onClick}>
      {path ? (
        <Link href={path} target={path.startsWith("http") ? "_blank" : ""}>
          {t(name)}
        </Link>
      ) : (
        t(name)
      )}
      {!path && (
        <Icon type={isExpanded ? "expand_less" : "expand_more"} size={20} />
      )}
    </MobileNavItemInner>
  );
};

export default MobileNavItem;
