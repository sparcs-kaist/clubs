import React, { useCallback, useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";

import { RegistrationTypeEnum } from "@clubs/interface/common/enum/registration.enum";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import Button from "@sparcs-clubs/web/common/components/Button";
import Card from "@sparcs-clubs/web/common/components/Card";
import CheckboxOption from "@sparcs-clubs/web/common/components/CheckboxOption";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import FormController from "@sparcs-clubs/web/common/components/FormController";
import PhoneInput from "@sparcs-clubs/web/common/components/Forms/PhoneInput";
import TextInput from "@sparcs-clubs/web/common/components/Forms/TextInput";
import SectionTitle from "@sparcs-clubs/web/common/components/SectionTitle";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import {
  notAllowKrRegx,
  regxErrorMessage,
} from "@sparcs-clubs/web/features/register-club/constants";
import useGetAvailableRegistrationInfo from "@sparcs-clubs/web/features/register-club/hooks/useGetAvailableRegistrationInfo";
import useGetClubsForReProvisional from "@sparcs-clubs/web/features/register-club/services/useGetClubsForReProvisional";

import ClubNameField from "./_atomic/ClubNameField";
import DivisionSelect from "./_atomic/DivisionSelect";
import MonthSelect from "./_atomic/MonthSelect";
import YearSelect from "./_atomic/YearSelect";
import ProfessorInformFrame from "./ProfessorInformFrame";

interface ProvisionalBasicInformFrameProps {
  isInitialCheckedProfessor?: boolean;
  editMode?: boolean;
  profile?: { name: string; phoneNumber?: string };
}

const ProvisionalBasicInformFrame: React.FC<
  ProvisionalBasicInformFrameProps
> = ({
  isInitialCheckedProfessor = false,
  editMode = false,
  profile = undefined,
}) => {
  const { control, setValue, watch } = useFormContext();

  const registrationType = watch("registrationTypeEnumId");

  const { data, isLoading, isError } = useGetClubsForReProvisional();
  const {
    data: availableRegistrationInfo,
    isLoading: isLoadingAvailableRegistrationInfo,
    isError: isErrorAvailableRegistrationInfo,
  } = useGetAvailableRegistrationInfo();

  const [isCheckedProfessor, setIsCheckedProfessor] = useState(
    isInitialCheckedProfessor,
  );

  useEffect(() => {
    if (!isCheckedProfessor) {
      setValue("professor", undefined, { shouldValidate: true });
    }
  }, [setValue, isCheckedProfessor]);

  const updateRegistrationType = (type: RegistrationTypeEnum) => {
    setValue("registrationTypeEnumId", type, { shouldValidate: true });
  };

  const buttonType = useCallback(
    (type: RegistrationTypeEnum) => {
      if (type === RegistrationTypeEnum.ReProvisional) {
        if (
          !availableRegistrationInfo.haveAvailableRegistration ||
          availableRegistrationInfo.noManageClub ||
          !availableRegistrationInfo.availableRegistrations.includes(
            RegistrationTypeEnum.ReProvisional,
          )
        ) {
          return "disabled";
        }
      }

      if (type === registrationType) {
        return "default";
      }
      if (editMode) {
        return "disabled";
      }
      return "outlined";
    },
    [registrationType],
  );

  return (
    <AsyncBoundary
      isLoading={isLoading || isLoadingAvailableRegistrationInfo}
      isError={isError || isErrorAvailableRegistrationInfo}
    >
      <FlexWrapper direction="column" gap={40}>
        <SectionTitle>기본 정보</SectionTitle>
        <Card outline gap={32} style={{ marginLeft: 20 }}>
          <FlexWrapper direction="row" gap={32} style={{ width: "100%" }}>
            <TextInput
              label="대표자 이름"
              placeholder={profile?.name ?? ""}
              disabled
            />
            <FormController
              name="phoneNumber"
              required
              control={control}
              defaultValue={profile?.phoneNumber}
              minLength={13}
              rules={{
                validate: value =>
                  /^010-\d{4}-\d{4}$/.test(value.trim())
                    ? undefined
                    : "올바른 전화번호 형식이 아닙니다.",
              }}
              renderItem={props => (
                <PhoneInput
                  {...props}
                  label="대표자 전화번호"
                  placeholder="010-XXXX-XXXX"
                />
              )}
            />
          </FlexWrapper>
          <FlexWrapper direction="column" gap={4}>
            <FlexWrapper direction="row" gap={8} style={{ marginLeft: 2 }}>
              <Typography fw="MEDIUM" color="BLACK">
                가등록 신청 구분
              </Typography>
              <Typography fs={14} color="GRAY.600">
                * 동아리 신청이 처음이라면 가등록(신규), 이전에 동아리로 활동한
                적이 있다면 가등록(재)를 선택해주세요
              </Typography>
            </FlexWrapper>
            <FlexWrapper direction="row" gap={16} style={{ width: "100%" }}>
              <Button
                type={buttonType(RegistrationTypeEnum.NewProvisional)}
                onClick={() =>
                  updateRegistrationType(RegistrationTypeEnum.NewProvisional)
                }
                style={{ flex: 1 }}
              >
                가등록(신규)
              </Button>
              <Button
                type={buttonType(RegistrationTypeEnum.ReProvisional)}
                onClick={() =>
                  updateRegistrationType(RegistrationTypeEnum.ReProvisional)
                }
                style={{ flex: 1 }}
              >
                가등록(재)
              </Button>
            </FlexWrapper>
          </FlexWrapper>
          {registrationType && (
            <>
              <ClubNameField
                type={registrationType}
                clubList={
                  registrationType === RegistrationTypeEnum.ReProvisional
                    ? data?.clubs
                    : []
                }
                editMode={editMode}
              />
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
                    label="활동 분야 (국문)"
                    placeholder="활동 분야를 입력해주세요"
                  />
                )}
              />
              <FormController
                name="activityFieldEn"
                required
                control={control}
                rules={{
                  validate: value =>
                    notAllowKrRegx.test(value) ? undefined : regxErrorMessage,
                }}
                renderItem={props => (
                  <TextInput
                    {...props}
                    label="활동 분야 (영문)"
                    placeholder="활동 분야를 입력해주세요"
                  />
                )}
              />
              <CheckboxOption
                optionText="지도교수를 신청하겠습니다"
                checked={isCheckedProfessor}
                onClick={() => {
                  setIsCheckedProfessor(!isCheckedProfessor);
                }}
              />
            </>
          )}
        </Card>
        {isCheckedProfessor && <ProfessorInformFrame />}
      </FlexWrapper>
    </AsyncBoundary>
  );
};

export default ProvisionalBasicInformFrame;
