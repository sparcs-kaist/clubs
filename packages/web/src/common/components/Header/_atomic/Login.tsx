"use client";

import { jwtDecode } from "jwt-decode";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import styled from "styled-components";

import Icon from "@sparcs-clubs/web/common/components/Icon";
import MyMenu from "@sparcs-clubs/web/common/components/MyMenu";
import { useAuth } from "@sparcs-clubs/web/common/providers/AuthContext";
import { getUserType } from "@sparcs-clubs/web/utils/getUserType";
import { getLocalStorageItem } from "@sparcs-clubs/web/utils/localStorage";

const LoginInner = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  font-family: ${({ theme }) => theme.fonts.FAMILY.PRETENDARD};
  font-size: 16px;
  line-height: 20px;
  font-weight: ${({ theme }) => theme.fonts.WEIGHT.MEDIUM};
  color: ${({ theme }) => theme.colors.BLACK};
  text-decoration: none;
  cursor: pointer;
  width: max-content;

  @media (max-width: ${({ theme }) => theme.responsive.BREAKPOINT.md}) {
    display: none;
  }
`;

const Login = () => {
  const { isLoggedIn, login } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userName, setUserName] = useState("");
  const [type, setType] = useState("");
  const [selectedToken, setSelectedToken] = useState<string>("");
  const t = useTranslations();

  useEffect(() => {
    if (!isLoggedIn) {
      setIsMenuOpen(false);
    } else {
      const token = getLocalStorageItem("accessToken");
      if (token) {
        setSelectedToken(token);
        const decoded: { name?: string; type?: string } = jwtDecode(token);
        setUserName(decoded.name || "Unknown User");
        setType(decoded.type || "Unknown Type");
      }
    }
  }, [isLoggedIn, selectedToken]);

  return (
    <>
      {isLoggedIn ? (
        <LoginInner onClick={() => setIsMenuOpen(!isMenuOpen)}>
          <Icon type="person" size={16} />
          {userName} ({t(`common.${getUserType(type)}`)})
        </LoginInner>
      ) : (
        <LoginInner onClick={login}>
          <Icon type="login" size={16} />
          {t("path.로그인")}
        </LoginInner>
      )}
      {isMenuOpen && (
        <MyMenu
          setIsMenuOpen={setIsMenuOpen}
          selectedToken={selectedToken}
          setSelectedToken={setSelectedToken}
        />
      )}
    </>
  );
};

export default Login;
