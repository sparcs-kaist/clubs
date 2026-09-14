import { useTranslations } from "next-intl";
import React, { useMemo, useState } from "react";
import { useFormContext } from "react-hook-form";

import Select, { SelectItem } from "@sparcs-clubs/web/common/components/Select";
import { RegisterClubModel } from "@sparcs-clubs/web/features/register-club/types/registerClub";
import {
  getActualMonth,
  getActualYear,
} from "@sparcs-clubs/web/utils/Date/extractDate";

const YearSelect: React.FC = () => {
  const t = useTranslations("my.registration");
  const { setValue, watch } = useFormContext<RegisterClubModel>();

  const foundedAt = watch("foundedAt");
  const initialValue = useMemo(
    () => (foundedAt ? getActualYear(foundedAt).toString() : ""),
    [foundedAt],
  );
  const [value, onChangeValue] = useState<string>(initialValue);

  const startYear = 1980;
  const years = Array.from(
    { length: new Date().getFullYear() - startYear + 1 },
    (_, i) => startYear + i,
  ).reverse();
  const items: SelectItem<string>[] = years.map(data => ({
    value: data.toString(),
    label: data.toString(),
  }));

  const onChange = (_value: string) => {
    const year = parseInt(_value);
    const month = foundedAt ? getActualMonth(foundedAt) : 1;
    const date = new Date(`${year}-${month.toString().padStart(2, "0")}-01`);
    setValue("foundedAt", date, { shouldValidate: true });
    onChangeValue(_value);
  };

  return (
    <Select
      label={t("foundedYear")}
      placeholder={t("foundedYearPlaceholder")}
      items={items}
      value={value}
      onChange={onChange}
    />
  );
};

export default YearSelect;
