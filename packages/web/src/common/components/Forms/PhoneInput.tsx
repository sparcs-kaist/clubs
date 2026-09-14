import { useTranslations } from "next-intl";
import React, { ChangeEvent, useCallback, useEffect, useState } from "react";

import TextInput, {
  TextInputProps,
} from "@sparcs-clubs/web/common/components/Forms/TextInput";

interface PhoneInputProps extends Omit<TextInputProps, "onChange"> {
  value?: string;
  onChange: (value: string) => void;
}

const PhoneInput: React.FC<PhoneInputProps> = ({
  label = "",
  value = "",
  onChange,
  ...props
}) => {
  const t = useTranslations("common");
  const [error, setError] = useState("");
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (touched) {
      const isValidFormat =
        /^(\d{3}-\d{4}-\d{4})$/.test(value) ||
        /^\d*$/.test(value.replace(/-/g, ""));

      if (!value) {
        setError(t("forms.required"));
      } else if (!isValidFormat) {
        setError(t("forms.numbersOnly"));
      } else if (
        value.replace(/-/g, "").length !== 11 ||
        value.slice(0, 3) !== "010"
      ) {
        setError(t("forms.invalidPhone"));
      } else {
        setError("");
      }
    }
  }, [value, touched, t]);

  const handleBlur = () => {
    setTouched(true);
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const inputValue = e.target.value;

    if (inputValue.length <= 13) {
      onChange(inputValue);
    }
  };

  const formatValue = useCallback(
    (nums: string) => {
      if (nums.match(/-/g)?.length === 2) {
        const parts = nums.split("-");

        if (
          parts.length === 3 &&
          parts[0].length <= 3 && // (010) 최대 3자리
          parts[1].length <= 4 && // (xxxx) 최대 4자리
          parts[2].length <= 4 // (xxxx) 최대 4자리
        ) {
          return `${parts[0].replace(/\D/g, "")}-${parts[1].replace(/\D/g, "")}-${parts[2].replace(/\D/g, "")}`;
        }
      }

      const digits = nums.replace(/\D/g, "");

      let formattedInput = "";

      if (digits.length <= 3) {
        formattedInput = digits;
      } else if (digits.length <= 7) {
        formattedInput = `${digits.slice(0, 3)}-${digits.slice(3)}`;
      } else if (digits.length <= 11) {
        formattedInput = `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
      }

      return formattedInput;
    },
    [value],
  );

  return (
    <TextInput
      label={label}
      value={formatValue(value)}
      onChange={handleChange}
      errorMessage={error}
      onBlur={handleBlur}
      {...props}
    />
  );
};
// TODO: DB 값 default로 넣어두기

export default PhoneInput;
