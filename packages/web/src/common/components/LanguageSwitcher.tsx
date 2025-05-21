import { useEffect, useState } from "react";
import styled from "styled-components";

import { Locale } from "@sparcs-clubs/web/i18n/config";
import { getUserLocale, setUserLocale } from "@sparcs-clubs/web/i18n/locale";

import Icon from "./Icon";
import Typography from "./Typography";

const LangaugeSwitcherWrapper = styled.div`
  display: flex;
  flex-direction: row;
  gap: 6px;
  align-items: center;
`;

const LanguageSwitcherLine = styled.div`
  width: 1px;
  height: 8px;
  background-color: ${({ theme }) => theme.colors.GRAY[300]};
`;

const LanguageSwitcher = ({ isMobile }: { isMobile: boolean }) => {
  const [locale, setLocale] = useState<Locale>("ko");
  // TODO: suspense query 활용하면 아래 useEffect 필요없음
  useEffect(() => {
    const fetchLocale = async () => {
      const currentLocale = await getUserLocale();
      setLocale(currentLocale as Locale);
    };
    fetchLocale();
  }, []);

  if (isMobile) {
    return (
      <Icon
        type={"language"}
        onClick={() => {
          setUserLocale(locale === "ko" ? "en" : "ko");
          setLocale(locale === "ko" ? "en" : "ko");
        }}
        size={18}
      />
    );
  }

  return (
    <LangaugeSwitcherWrapper>
      <Icon type={"language"} size={13} />
      <Typography
        fs={16}
        lh={20}
        fw="MEDIUM"
        onClick={() => {
          if (locale === "en") {
            setUserLocale("ko");
            setLocale("ko");
          }
        }}
        color={locale === "ko" ? "BLACK" : "GRAY.300"}
        style={{ cursor: locale === "ko" ? undefined : "pointer" }}
      >
        KO
      </Typography>
      <LanguageSwitcherLine />
      <Typography
        fs={16}
        lh={20}
        fw="MEDIUM"
        onClick={() => {
          if (locale === "ko") {
            setUserLocale("en");
            setLocale("en");
          }
        }}
        color={locale === "en" ? "BLACK" : "GRAY.300"}
        style={{ cursor: locale === "en" ? undefined : "pointer" }}
      >
        EN
      </Typography>
    </LangaugeSwitcherWrapper>
  );
};

export default LanguageSwitcher;
