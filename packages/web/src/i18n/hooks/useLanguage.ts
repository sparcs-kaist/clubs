import { useEffect, useState } from "react";

import { getUserLocale } from "@sparcs-clubs/web/i18n/locale";
import logger from "@sparcs-clubs/web/utils/logger";

export const useLanguage = () => {
  const [isEnglish, setIsEnglish] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkLanguage = async () => {
      try {
        const currentLocale = await getUserLocale();
        setIsEnglish(currentLocale === "en");
      } catch (error) {
        logger.error("Failed to get user locale:", error);
        setIsEnglish(false); // 기본값은 한국어
      } finally {
        setIsLoading(false);
      }
    };

    checkLanguage();
  }, []);

  return { isEnglish, isLoading };
};
