import { Locale } from "@sparcs-clubs/web/i18n/config";
import { getUserLocale, setUserLocale } from "@sparcs-clubs/web/i18n/locale";

import Icon from "./Icon";

const LanguageSwitcher = () => {
  const toggleLanguage = async () => {
    const currentLocale = (await getUserLocale()) as Locale;
    await setUserLocale(currentLocale === "ko" ? "en" : "ko");
  };

  return <Icon type={"language"} onClick={toggleLanguage} size={20} />;
};

export default LanguageSwitcher;
