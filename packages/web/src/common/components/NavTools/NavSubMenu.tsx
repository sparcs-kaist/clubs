"use client";

import { useTranslations } from "next-intl";
import React from "react";
import styled from "styled-components";

import { useGetFeatureFlagString } from "@sparcs-clubs/web/hooks/getFeatureFlag";

import NavSubItem from "./NavSubItem";

type SubPath = {
  name: string;
  path?: string;
  featureFlag?: string;
};

const NavItemOuter = styled.div`
  position: absolute;
  top: calc(100% - 8px);
  cursor: pointer;
`;

const NavItemInner = styled.div`
  margin-top: 16px;
  display: inline-flex;
  padding: 12px;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 4px;
  background-color: ${({ theme }) => theme.colors.WHITE};
  border-radius: 8px;
`;

const NavSubMenu = ({ sub }: { sub: SubPath[] }) => {
  const ff = useGetFeatureFlagString();
  const t = useTranslations();

  const filteredSub = sub.filter(({ featureFlag }) => {
    if (!featureFlag) return false;
    return ff(featureFlag);
  });

  return (
    <NavItemOuter>
      <NavItemInner>
        {filteredSub.map(({ name, path }) => (
          <NavSubItem key={name} name={t(name)} path={path} />
        ))}
      </NavItemInner>
    </NavItemOuter>
  );
};

export default NavSubMenu;
