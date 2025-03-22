import React from "react";

import { locales } from "@sparcs-clubs/web/i18n/config";
import { setUserLocale } from "@sparcs-clubs/web/i18n/locale";

import Button from "./Button";

const LanguageSwitcher = () => (
  <div style={{ display: "flex", gap: "12px" }}>
    {locales.map(locale => (
      <Button key={locale} onClick={() => setUserLocale(locale)}>
        {locale.toUpperCase()}
      </Button>
    ))}
  </div>
);

export default LanguageSwitcher;
