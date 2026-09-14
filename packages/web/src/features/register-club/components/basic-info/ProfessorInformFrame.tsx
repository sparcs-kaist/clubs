import { useTranslations } from "next-intl";
import React, { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import styled from "styled-components";

import { ProfessorEnum } from "@clubs/interface/common/enum/user.enum";

import Card from "@sparcs-clubs/web/common/components/Card";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import FormController from "@sparcs-clubs/web/common/components/FormController";
import TextInput from "@sparcs-clubs/web/common/components/Forms/TextInput";
import SectionTitle from "@sparcs-clubs/web/common/components/SectionTitle";
import Select from "@sparcs-clubs/web/common/components/Select";
import { RegisterClubModel } from "@sparcs-clubs/web/features/register-club/types/registerClub";
import { EmailValidator } from "@sparcs-clubs/web/utils/validator";

const RowWrapper = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
  gap: 32px;
`;

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
  }, [isValid]);

  return (
    <FlexWrapper direction="column" gap={40}>
      <SectionTitle>{t("professorInfo")}</SectionTitle>
      <Card outline gap={32} style={{ marginLeft: 20 }}>
        <RowWrapper>
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
            name="professor.professorEnumId"
            required
            control={control}
            renderItem={props => (
              <Select
                {...props}
                label={t("professorRank")}
                placeholder={t("professorRankPlaceholder")}
                items={[
                  {
                    value: ProfessorEnum.Full,
                    label: t("fullProfessor"),
                  },
                  {
                    value: ProfessorEnum.Associate,
                    label: t("associateProfessor"),
                  },
                  {
                    value: ProfessorEnum.Assistant,
                    label: t("assistantProfessor"),
                  },
                ]}
              />
            )}
          />
        </RowWrapper>
        <FormController
          name="professor.email"
          required
          control={control}
          rules={{
            validate: value => {
              const emailRegex: RegExp = /^[a-zA-Z0-9._%+-]+@kaist\.ac\.kr$/;

              if (typeof value !== "string") {
                return true;
              }

              if (value.length === 0) {
                return true;
              }

              return EmailValidator.validate(value, true, emailRegex)
                ? t("invalidEmail")
                : true;
            },
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
