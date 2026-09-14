import { useTranslations } from "next-intl";
import React, { useMemo, useState } from "react";
import { useFormContext } from "react-hook-form";

import Select, { SelectItem } from "@sparcs-clubs/web/common/components/Select";
import { RegisterClubModel } from "@sparcs-clubs/web/features/register-club/types/registerClub";
import {
  getActualMonth,
  getActualYear,
} from "@sparcs-clubs/web/utils/Date/extractDate";

const MonthSelect: React.FC = () => {
  const t = useTranslations("my.registration");
  const { setValue, watch } = useFormContext<RegisterClubModel>();

  const foundedAt = watch("foundedAt");
  const initialValue = useMemo(
    () => (foundedAt ? getActualMonth(foundedAt).toString() : ""),
    [foundedAt],
  );
  const [value, onChangeValue] = useState<string>(initialValue);

  const items: SelectItem<string>[] = Array.from(
    { length: 12 },
    (_, i) => i + 1,
  ).map(data => ({
    value: data.toString(),
    label: data.toString(),
  }));

  const onChange = (_value: string) => {
    const month = parseInt(_value);
    const year = foundedAt ? getActualYear(foundedAt) : 2020;
    const date = new Date(`${year}-${month.toString().padStart(2, "0")}-01`);
    setValue("foundedAt", date, { shouldValidate: true });
    onChangeValue(_value);
  };

  return (
    <Select
      label={t("foundedMonth")}
      placeholder={t("foundedMonthPlaceholder")}
      items={items}
      value={value}
      onChange={onChange}
    />
  );
};

export default MonthSelect;
