import { useTranslations } from "next-intl";
import { useFormContext } from "react-hook-form";

import { zKrPhoneNumber } from "@clubs/interface/common/type/phoneNumber.type";

import FormController from "@sparcs-clubs/web/common/components/FormController";
import PhoneInput from "@sparcs-clubs/web/common/components/Forms/PhoneInput";
import { RegisterClubModel } from "@sparcs-clubs/web/features/register-club/types/registerClub";

const RegistrationPhoneField = ({
  initialPhone = "",
  editMode = false,
}: {
  initialPhone?: string;
  editMode?: boolean;
}) => {
  const t = useTranslations("my.registration");
  const label = t("applicantPhone");
  const { control } = useFormContext<RegisterClubModel>();

  return (
    <FormController
      name="phoneNumber"
      control={control}
      defaultValue={initialPhone}
      required={!editMode}
      rules={{
        validate: value =>
          (editMode && value === initialPhone) ||
          zKrPhoneNumber.safeParse(value).success ||
          t("invalidPhone"),
      }}
      renderItem={({ onChange, value, ...props }) => (
        <PhoneInput
          {...props}
          label={label}
          aria-label={label}
          helperText={t(
            editMode ? "applicantPhoneEditHelp" : "applicantPhoneSubmitHelp",
          )}
          placeholder="010-XXXX-XXXX"
          value={value}
          formatDisplay={!editMode || value !== initialPhone}
          onChange={phone =>
            onChange(phone.replace(/^(010)(\d{4})(\d{4})$/, "$1-$2-$3"))
          }
        />
      )}
    />
  );
};

export default RegistrationPhoneField;
