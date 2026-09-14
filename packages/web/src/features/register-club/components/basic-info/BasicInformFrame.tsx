import React, { useEffect, useMemo, useState } from "react";
import { useFormContext } from "react-hook-form";

import { RegistrationTypeEnum } from "@clubs/interface/common/enum/registration.enum";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import Card from "@sparcs-clubs/web/common/components/Card";
import CheckboxOption from "@sparcs-clubs/web/common/components/CheckboxOption";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import FormController from "@sparcs-clubs/web/common/components/FormController";
import PhoneInput from "@sparcs-clubs/web/common/components/Forms/PhoneInput";
import TextInput from "@sparcs-clubs/web/common/components/Forms/TextInput";
import SectionTitle from "@sparcs-clubs/web/common/components/SectionTitle";
import {
  notAllowKrRegx,
  regxErrorMessage,
} from "@sparcs-clubs/web/features/register-club/constants";
import useGetClubsForPromotional from "@sparcs-clubs/web/features/register-club/services/useGetClubsForPromotional";
import useGetClubsForRenewal from "@sparcs-clubs/web/features/register-club/services/useGetClubsForRenewal";
import {
  ClubRegistrationInfo,
  RegisterClubModel,
} from "@sparcs-clubs/web/features/register-club/types/registerClub";

import ClubNameField from "./_atomic/ClubNameField";
import DivisionSelect from "./_atomic/DivisionSelect";
import YearSelect from "./_atomic/YearSelect";
import ProfessorInformFrame from "./ProfessorInformFrame";

interface BasicInformSectionProps {
  type: RegistrationTypeEnum;
  editMode?: boolean;
  existingClub?: ClubRegistrationInfo;
  profile?: { name: string; phoneNumber?: string };
}

const BasicInformFrame: React.FC<BasicInformSectionProps> = ({
  type,
  editMode = false,
  existingClub,
  profile = undefined,
}) => {
  const isRenewal = type === RegistrationTypeEnum.Renewal;

  const [isCheckedProfessor, setIsCheckedProfessor] = useState(
    !editMode || !isRenewal || existingClub?.professor != null,
  );

  const { watch, control, setValue } = useFormContext<RegisterClubModel>();
  const clubId = watch("clubId");
  const professor = watch("professor");

  const {
    data: promotionalList,
    isLoading: isLoadingPromotional,
    isError: isErrorPromotional,
  } = useGetClubsForPromotional();
  const {
    data: renewalList,
    isLoading: isLoadingRenewal,
    isError: isErrorRenewal,
  } = useGetClubsForRenewal();

  const isLoading = isRenewal ? isLoadingRenewal : isLoadingPromotional;
  const isError = isRenewal ? isErrorRenewal : isErrorPromotional;
  const availableClubList = isRenewal ? renewalList : promotionalList;
  const clubList = editMode
    ? { clubs: existingClub ? [existingClub] : [] }
    : availableClubList;

  const professorInfo = useMemo(() => {
    if (editMode) return existingClub?.professor ?? null;
    if (clubId === null) return undefined;
    return clubList?.clubs.find(club => club.id === clubId)?.professor;
  }, [clubId, clubList, editMode, existingClub]);

  useEffect(() => {
    if (!isCheckedProfessor) {
      setValue("professor", undefined, { shouldValidate: true });
      return;
    }
    if (professor || professorInfo == null) return;
    setValue("professor", professorInfo, { shouldValidate: true });
  }, [professorInfo, isCheckedProfessor, setValue]);

  return (
    <AsyncBoundary
      isLoading={!editMode && isLoading}
      isError={!editMode && isError}
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
          <ClubNameField
            type={type}
            clubList={clubList?.clubs}
            editMode={editMode}
          />
          <FlexWrapper direction="row" gap={32} style={{ width: "100%" }}>
            <YearSelect />
            <DivisionSelect isRenewal={isRenewal} />
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

          {isRenewal &&
            clubId !== null &&
            clubId !== undefined &&
            professorInfo === null && (
              <CheckboxOption
                optionText="지도교수를 신청하겠습니다"
                checked={isCheckedProfessor}
                onClick={() => {
                  setIsCheckedProfessor(!isCheckedProfessor);
                }}
              />
            )}
        </Card>
        {(!isRenewal || (isCheckedProfessor && clubId != null)) && (
          <ProfessorInformFrame />
        )}
      </FlexWrapper>
    </AsyncBoundary>
  );
};

export default BasicInformFrame;
