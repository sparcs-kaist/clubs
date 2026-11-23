import { useTranslations } from "next-intl";
import { useFormContext } from "react-hook-form";

import { getRegistrationActivityFieldError } from "@clubs/interface/api/registration/type/registration-application";

import FormController from "@sparcs-clubs/web/common/components/FormController";
import TextInput from "@sparcs-clubs/web/common/components/Forms/TextInput";
import { notAllowKrRegx } from "@sparcs-clubs/web/features/register-club/constants";
import { RegisterClubModel } from "@sparcs-clubs/web/features/register-club/types/registerClub";

const names = ["activityFieldKr", "activityFieldEn"] as const;

const ActivityFieldInputs = () => {
  const { control } = useFormContext<RegisterClubModel>();
  const t = useTranslations("my.registration");

  return names.map(name => (
    <FormController
      key={name}
      name={name}
      required
      control={control}
      requiredMessage={t(`validation.${name}Required`)}
      rules={{
        validate: value => {
          const error = getRegistrationActivityFieldError(value);
          if (error === "required") return t(`validation.${name}Required`);
          if (error === "tooLong") return t(`validation.${name}TooLong`);
          if (name === "activityFieldEn" && !notAllowKrRegx.test(value)) {
            return t("invalidForeignCharacters");
          }
          return true;
        },
      }}
      renderItem={props => (
        <TextInput
          {...props}
          label={t(name)}
          placeholder={t("activityFieldPlaceholder")}
          helperText={t("activityFieldLimits")}
        />
      )}
    />
  ));
};

export default ActivityFieldInputs;
