import { useTranslations } from "next-intl";
import React, { useEffect } from "react";
import { useFormContext } from "react-hook-form";

import { zRegistrationProfessorEmail } from "@clubs/interface/api/registration/type/registration-application";

import Card from "@sparcs-clubs/web/common/components/Card";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import FormController from "@sparcs-clubs/web/common/components/FormController";
import TextInput from "@sparcs-clubs/web/common/components/Forms/TextInput";
import SectionTitle from "@sparcs-clubs/web/common/components/SectionTitle";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import { RegisterClubModel } from "@sparcs-clubs/web/features/register-club/types/registerClub";

const ProfessorInformFrame: React.FC = () => {
  const t = useTranslations("my.registration");
  const {
    control,
    trigger,
    formState: { isValid },
  } = useFormContext<RegisterClubModel>();

  useEffect(() => {
    if (!isValid) {
      trigger();
    }
  }, [isValid, trigger]);

  return (
    <FlexWrapper direction="column" gap={40}>
      <SectionTitle>{t("professorInfo")}</SectionTitle>
      <Card outline gap={32} style={{ marginLeft: 20 }}>
        <Typography color="GRAY.600" fs={14} lh={20}>
          {t("professorEligibility")}
        </Typography>
        <FormController
          name="professor.name"
          required
          control={control}
          renderItem={props => (
            <TextInput
              {...props}
              label={t("professorName")}
              placeholder={t("professorNamePlaceholder")}
            />
          )}
        />
        <FormController
          name="professor.email"
          required
          control={control}
          rules={{
            validate: value =>
              !value ||
              zRegistrationProfessorEmail.safeParse(value).success ||
              t("invalidEmail"),
          }}
          renderItem={props => (
            <TextInput
              {...props}
              label={t("professorEmail")}
              placeholder="xxxxx@kaist.ac.kr"
            />
          )}
        />
      </Card>
    </FlexWrapper>
  );
};

export default ProfessorInformFrame;
