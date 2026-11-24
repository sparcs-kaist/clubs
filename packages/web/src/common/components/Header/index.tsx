"use client";

import React, { useEffect, useState } from "react";
import styled, { useTheme } from "styled-components";

import { isClubRegistrationOpen } from "@clubs/interface/api/registration/endpoint/apiReg027";

import Icon from "@sparcs-clubs/web/common/components/Icon";
import NavList from "@sparcs-clubs/web/common/components/NavTools/NavList";
import useMediaQuery from "@sparcs-clubs/web/common/hooks/useMediaQuery";
import { useAuth } from "@sparcs-clubs/web/common/providers/AuthContext";
import navPaths from "@sparcs-clubs/web/constants/nav";
import paths from "@sparcs-clubs/web/constants/paths";
import useGetClubRegistrationDeadline from "@sparcs-clubs/web/features/clubs/services/useGetClubRegistrationDeadline";
import { getFeatureFlagString } from "@sparcs-clubs/web/hooks/getFeatureFlag";

import FlexWrapper from "../FlexWrapper";
import LanguageSwitcher from "../LanguageSwitcher";
import MobileNavMenu from "../NavTools/MobileNavMenu";
import Beta from "./_atomic/Beta";
import Login from "./_atomic/Login";
import Logo from "./_atomic/Logo";

const IdentityBar = styled.div`
  width: 100%;
  height: 5px;
  background-color: ${({ theme }) => theme.colors.PRIMARY};
`;

const LogoContainer = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const NavInner = styled.div`
  display: flex;
  height: 50px;
  padding: 0px 20px;
  justify-content: space-between;
  align-items: center;
`;

const HeaderInner = styled.div`
  position: sticky;
  top: 0;
  z-index: 10;
  -webkit-backdrop-filter: blur(
    10px
  ); /* Add this line first, it fixes blur for Safari*/
  backdrop-filter: blur(10px);
`;

const Header: React.FC = () => {
  const isBetaPeriod = true;
  const theme = useTheme();
  const isSmallerThanMd = useMediaQuery(
    `(max-width: ${theme.responsive.BREAKPOINT.md})`,
  );
  const isMobile = useMediaQuery(
    `(max-width: ${theme.responsive.BREAKPOINT.xs})`,
  );

  const [isMobileMenuVisible, setIsMobileMenuVisible] = useState<boolean>();

  const { profile } = useAuth();
  const { data: registration, isError: registrationError } =
    useGetClubRegistrationDeadline();
  const [periodCheckedAt, setPeriodCheckedAt] = useState(Date.now);
  const period = registration?.deadline;
  const registrationOpen = !registrationError && isClubRegistrationOpen(period);
  const hiddenSubPath = registrationOpen ? undefined : "/register-club";

  useEffect(() => {
    if (!period) return undefined;
    const remaining = new Date(period.endTerm).getTime() - Date.now();
    if (!(remaining > 0)) return undefined;
    const timer = setTimeout(
      () => setPeriodCheckedAt(Date.now()),
      Math.min(remaining, 2 ** 31 - 1),
    );
    return () => clearTimeout(timer);
  }, [period, periodCheckedAt]);

  const headerPaths = navPaths.header
    .filter(
      menu =>
        paths[menu].authority.includes(profile?.type as string) ||
        paths[menu].authority.includes("all"),
    )
    .filter(menu => getFeatureFlagString(paths[menu].featureFlag));

  const handleClose = () => {
    setIsMobileMenuVisible(false);
  };
  const handleClick = () => {
    setIsMobileMenuVisible(prev => !prev);
  };

  return (
    <HeaderInner>
      <IdentityBar />
      <NavInner>
        <FlexWrapper gap={45} direction="row">
          <LogoContainer>
            <Logo onClick={handleClose} />
            {isBetaPeriod && <Beta />}
          </LogoContainer>
          {!isSmallerThanMd && (
            <NavList
              highlight
              keys={headerPaths}
              hiddenSubPath={hiddenSubPath}
            />
          )}
        </FlexWrapper>
        <FlexWrapper direction="row" gap={isSmallerThanMd ? 20 : 30}>
          <FlexWrapper gap={8} direction="row">
            <LanguageSwitcher isMobile={isMobile} />
            <Login />
          </FlexWrapper>
          {isSmallerThanMd && (
            <Icon
              type={isMobileMenuVisible ? "close" : "menu"}
              size={24}
              onClick={handleClick}
            />
          )}
        </FlexWrapper>
      </NavInner>
      {isMobileMenuVisible && (
        <MobileNavMenu
          keys={headerPaths}
          hiddenSubPath={hiddenSubPath}
          onClose={() => setIsMobileMenuVisible(!isMobileMenuVisible)}
        />
      )}
    </HeaderInner>
  );
};

export default Header;
