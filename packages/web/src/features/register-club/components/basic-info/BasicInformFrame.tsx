import { useTranslations } from "next-intl";
import React, { useEffect, useMemo, useState } from "react";
import { useFormContext } from "react-hook-form";

import { RegistrationTypeEnum } from "@clubs/interface/common/enum/registration.enum";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import Card from "@sparcs-clubs/web/common/components/Card";
import CheckboxOption from "@sparcs-clubs/web/common/components/CheckboxOption";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import TextInput from "@sparcs-clubs/web/common/components/Forms/TextInput";
import SectionTitle from "@sparcs-clubs/web/common/components/SectionTitle";
import useGetClubsForPromotional from "@sparcs-clubs/web/features/register-club/services/useGetClubsForPromotional";
import useGetClubsForRenewal from "@sparcs-clubs/web/features/register-club/services/useGetClubsForRenewal";
import {
  ClubRegistrationInfo,
  RegisterClubModel,
  toProfessorContact,
} from "@sparcs-clubs/web/features/register-club/types/registerClub";

import ActivityFieldInputs from "./_atomic/ActivityFieldInputs";
import ClubNameField from "./_atomic/ClubNameField";
import DivisionSelect from "./_atomic/DivisionSelect";
import RegistrationPhoneField from "./_atomic/RegistrationPhoneField";
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
  const t = useTranslations("my.registration");
  const isRenewal = type === RegistrationTypeEnum.Renewal;

  const [isCheckedProfessor, setIsCheckedProfessor] = useState(
    !editMode || !isRenewal || existingClub?.professor != null,
  );

  const { getValues, watch, setValue } = useFormContext<RegisterClubModel>();
  const clubId = watch("clubId");

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
    if (getValues("professor") || professorInfo == null) return;
    setValue("professor", toProfessorContact(professorInfo), {
      shouldValidate: true,
    });
  }, [getValues, professorInfo, isCheckedProfessor, setValue]);

  return (
    <AsyncBoundary
      isLoading={!editMode && isLoading}
      isError={!editMode && isError}
    >
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
          <ClubNameField
            type={type}
            clubList={clubList?.clubs}
            editMode={editMode}
          />
          <FlexWrapper direction="row" gap={32} style={{ width: "100%" }}>
            <YearSelect />
            <DivisionSelect isRenewal={isRenewal} />
          </FlexWrapper>
          <ActivityFieldInputs />

          {isRenewal &&
            clubId !== null &&
            clubId !== undefined &&
            professorInfo === null && (
              <CheckboxOption
                optionText={t("requestProfessor")}
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
