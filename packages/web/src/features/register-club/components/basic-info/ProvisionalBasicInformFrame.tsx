import { useTranslations } from "next-intl";
import React, { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";

import Card from "@sparcs-clubs/web/common/components/Card";
import CheckboxOption from "@sparcs-clubs/web/common/components/CheckboxOption";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import FormController from "@sparcs-clubs/web/common/components/FormController";
import TextInput from "@sparcs-clubs/web/common/components/Forms/TextInput";
import SectionTitle from "@sparcs-clubs/web/common/components/SectionTitle";
import { notAllowKrRegx } from "@sparcs-clubs/web/features/register-club/constants";

import DivisionSelect from "./_atomic/DivisionSelect";
import MonthSelect from "./_atomic/MonthSelect";
import RegistrationPhoneField from "./_atomic/RegistrationPhoneField";
import YearSelect from "./_atomic/YearSelect";
import ProfessorInformFrame from "./ProfessorInformFrame";

export interface ProvisionalBasicInformFrameProps {
  children: React.ReactNode;
  editMode?: boolean;
  isInitialCheckedProfessor?: boolean;
  profile?: { name: string; phoneNumber?: string };
}

const ProvisionalBasicInformFrame: React.FC<
  ProvisionalBasicInformFrameProps
> = ({
  isInitialCheckedProfessor = false,
  children,
  profile = undefined,
  editMode = false,
}) => {
  const t = useTranslations("my.registration");
  const { control, setValue } = useFormContext();

  const [isCheckedProfessor, setIsCheckedProfessor] = useState(
    isInitialCheckedProfessor,
  );

  useEffect(() => {
    if (!isCheckedProfessor) {
      setValue("professor", undefined, { shouldValidate: true });
    }
  }, [setValue, isCheckedProfessor]);

  return (
    <FlexWrapper direction="column" gap={40}>
      <SectionTitle>{t("basicInfo")}</SectionTitle>
      <Card outline gap={32} style={{ marginLeft: 20 }}>
        <FlexWrapper direction="row" gap={32} style={{ width: "100%" }}>
          <TextInput
            label={t("representativeName")}
            placeholder={profile?.name ?? ""}
            disabled
          />
          <RegistrationPhoneField
            editMode={editMode}
            initialPhone={profile?.phoneNumber}
          />
        </FlexWrapper>
        {children}
        <FlexWrapper direction="row" gap={32} style={{ width: "100%" }}>
          <YearSelect />
          <MonthSelect />
          <DivisionSelect />
        </FlexWrapper>
        <FormController
          name="activityFieldKr"
          required
          control={control}
          renderItem={props => (
            <TextInput
              {...props}
              label={t("activityFieldKr")}
              placeholder={t("activityFieldPlaceholder")}
            />
          )}
        />
        <FormController
          name="activityFieldEn"
          required
          control={control}
          rules={{
            validate: value =>
              notAllowKrRegx.test(value)
                ? undefined
                : t("invalidForeignCharacters"),
          }}
          renderItem={props => (
            <TextInput
              {...props}
              label={t("activityFieldEn")}
              placeholder={t("activityFieldPlaceholder")}
            />
          )}
        />
        <CheckboxOption
          optionText={t("requestProfessor")}
          checked={isCheckedProfessor}
          onClick={() => {
            setIsCheckedProfessor(!isCheckedProfessor);
          }}
        />
      </Card>
      {isCheckedProfessor && <ProfessorInformFrame />}
    </FlexWrapper>
  );
};

export default ProvisionalBasicInformFrame;
