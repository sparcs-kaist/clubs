"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import React, { Fragment, useState } from "react";
import styled from "styled-components";

import { useAuth } from "@sparcs-clubs/web/common/providers/AuthContext";
import paths, { Paths } from "@sparcs-clubs/web/constants/paths";
import { useGetFeatureFlagString } from "@sparcs-clubs/web/hooks/getFeatureFlag";

import Button from "../Button";
import Icon from "../Icon";
import MobileNavItem from "./MobileNavItem";

type MobileNavMenuProps = {
  className?: string;
  keys: (keyof Paths)[];
  onClose: VoidFunction;
};

type Path = {
  name: string;
  path?: string;
  featureFlag?: string;
  sub?: Path[];
};

const MobileNavMenuInner = styled.div`
  position: absolute;
  display: flex;
  width: 100%;
  min-height: calc(100vh - 55px);
  padding: 16px;
  flex-direction: column;
  justify-content: flex-start;
  gap: 8px;

  background: ${({ theme }) => theme.colors.BACKGROUND};
  display: none;

  @media (max-width: ${({ theme }) => theme.responsive.BREAKPOINT.md}) {
    display: flex;
  }
`;

const MobileSubMenuInner = styled.div`
  display: flex;
  padding-left: 8px;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  gap: 4px;
  align-self: stretch;
`;

const LoginButton = styled(Button)`
  gap: 4px;
`;

const MobileNavMenu: React.FC<MobileNavMenuProps> = ({
  className = "",
  keys,
  onClose,
}) => {
  const [selectedMenu, setSelectedMenu] = useState<keyof Paths | null>(null);
  const currentPath = usePathname();
  const { isLoggedIn, login, logout } = useAuth();

  const isSelected = (key: keyof Paths) => selectedMenu === key;

  const router = useRouter();

  const t = useTranslations();
  const isFeatureEnabled = useGetFeatureFlagString();

  const handleMyPageClick = () => {
    onClose();
    router.push("/my");
  };

  const loginButton = () => {
    onClose();
    login();
  };

  const logoutButton = () => {
    onClose();
    logout();
  };

  return (
    <MobileNavMenuInner className={className}>
      {keys.map(key => {
        const subPath = (paths[key] as Path).sub?.filter(
          ({ featureFlag }) => featureFlag && isFeatureEnabled(featureFlag),
        );
        const haveSubPath = subPath && subPath.length > 0;

        return (
          <Fragment key={key}>
            <MobileNavItem
              isExpanded={haveSubPath ? isSelected(key) : false}
              {...paths[key]}
              onClick={() => {
                if (haveSubPath) {
                  if (isSelected(key)) {
                    setSelectedMenu(null);
                  } else {
                    setSelectedMenu(key);
                  }
                }
              }}
            />

            {isSelected(key) && (
              <MobileSubMenuInner>
                {subPath?.map(({ name, path }) => (
                  <MobileNavItem
                    key={name}
                    name={name}
                    path={path}
                    highlight={!!path && currentPath.includes(path)}
                    onClick={onClose}
                  />
                ))}
              </MobileSubMenuInner>
            )}
          </Fragment>
        );
      })}
      {isLoggedIn ? (
        <>
          <LoginButton type="outlined" onClick={handleMyPageClick}>
            <Icon type="person" size={16} />
            {t("path.마이페이지")}
          </LoginButton>
          <LoginButton type="outlined" onClick={logoutButton}>
            <Icon type="logout" size={16} />
            {t("path.로그아웃")}
          </LoginButton>
        </>
      ) : (
        <LoginButton type="outlined" onClick={loginButton}>
          <Icon type="login" size={16} />
          {t("path.로그인")}
        </LoginButton>
      )}
    </MobileNavMenuInner>
  );
};

export default MobileNavMenu;
