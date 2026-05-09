import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import React from "react";
import styled from "styled-components";

import { useAuth } from "@sparcs-clubs/web/common/providers/AuthContext";
import colors from "@sparcs-clubs/web/styles/themes/colors";
import { getUserType } from "@sparcs-clubs/web/utils/getUserType";

import Button from "../Button";
import FlexWrapper from "../FlexWrapper";
import Icon from "../Icon";
import ProfileList from "./_atomic/ProfileList";

interface MyMenuProps {
  setIsMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  selectedToken: string;
  setSelectedToken: React.Dispatch<React.SetStateAction<string>>;
}

const MyMenuWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 320px;
  padding: 16px;
  border-radius: 8px;
  background-color: ${({ theme }) => theme.colors.WHITE};
  align-items: center;
  position: absolute;
  top: 50px;
  right: 16px;
  border: 1px solid ${({ theme }) => theme.colors.GRAY[200]};

  @media (max-width: ${({ theme }) => theme.responsive.BREAKPOINT.md}) {
    display: none;
  }
`;

const Divider = styled.div`
  width: 100%;
  height: 1px;
  background-color: ${({ theme }) => theme.colors.GRAY[200]};
  border-radius: 4px;
`;

const MyMenu: React.FC<MyMenuProps> = ({
  setIsMenuOpen,
  selectedToken,
  setSelectedToken,
}) => {
  const router = useRouter();

  const handleMyPageClick = () => {
    router.push("/my");
    setIsMenuOpen(false);
  };
  const { logout } = useAuth();
  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
  };

  const t = useTranslations();

  const parsedToken = JSON.parse(localStorage.getItem("responseToken") || "{}");

  const profiles = Object.keys(parsedToken).map(type => ({
    profileType: getUserType(type),
    token: parsedToken[type],
  }));

  return (
    <MyMenuWrapper>
      <ProfileList
        profiles={profiles}
        setIsMenuOpen={setIsMenuOpen}
        selectedToken={selectedToken}
        setSelectedToken={setSelectedToken}
      />
      <Divider />
      <FlexWrapper direction="column" gap={8} style={{ width: "100%" }}>
        <Button
          type="outlined"
          onClick={handleMyPageClick}
          style={{ gap: "4px", color: colors.BLACK }}
        >
          <Icon type="person" size={16} />
          {t("path.마이페이지")}
        </Button>
        <Button
          type="outlined"
          onClick={handleLogout}
          style={{ gap: "4px", color: colors.BLACK }}
        >
          <Icon type="logout" size={16} />
          {t("path.로그아웃")}
        </Button>
      </FlexWrapper>
    </MyMenuWrapper>
  );
};

export default MyMenu;
