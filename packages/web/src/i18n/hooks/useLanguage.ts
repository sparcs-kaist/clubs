import { useLocale } from "next-intl";

export const useLanguage = () => {
  const locale = useLocale();
  return { isEnglish: locale === "en", isLoading: false };
};
