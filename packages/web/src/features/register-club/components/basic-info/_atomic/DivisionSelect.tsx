import { useTranslations } from "next-intl";
import React from "react";
import { useFormContext } from "react-hook-form";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import FormController from "@sparcs-clubs/web/common/components/FormController";
import Select, { SelectItem } from "@sparcs-clubs/web/common/components/Select";
import useGetDivisionType from "@sparcs-clubs/web/common/hooks/useGetDivisionType";
import { RegisterClubModel } from "@sparcs-clubs/web/features/register-club/types/registerClub";

interface DivisionSelectProps {
  isRenewal?: boolean;
}

const DivisionSelect: React.FC<DivisionSelectProps> = ({
  isRenewal = false,
}) => {
  const t = useTranslations("my.registration");
  const divisionT = useTranslations("division");
  const { control } = useFormContext<RegisterClubModel>();

  const { data, isLoading, isError } = useGetDivisionType();

  const divisionItems: SelectItem<number>[] =
    data?.divisions?.map(division => ({
      value: division.id,
      label: divisionT.has(division.name)
        ? divisionT(division.name)
        : division.name,
    })) ?? [];

  return (
    <AsyncBoundary isLoading={isLoading} isError={isError}>
      <FormController
        name="divisionId"
        required
        control={control}
        renderItem={props => (
          <Select
            {...props}
            label={isRenewal ? t("division") : t("preferredDivision")}
            placeholder={
              isRenewal
                ? t("divisionPlaceholder")
                : t("preferredDivisionPlaceholder")
            }
            items={divisionItems}
          />
        )}
      />
    </AsyncBoundary>
  );
};

export default DivisionSelect;
