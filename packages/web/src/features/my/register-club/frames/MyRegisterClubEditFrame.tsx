import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useFormatter, useTranslations } from "next-intl";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import styled from "styled-components";

import apiReg011, {
  ApiReg011ResponseOk,
} from "@clubs/interface/api/registration/endpoint/apiReg011";
import { RegistrationTypeEnum } from "@clubs/interface/common/enum/registration.enum";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import Button from "@sparcs-clubs/web/common/components/Button";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import Info from "@sparcs-clubs/web/common/components/Info";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import WarningInfo from "@sparcs-clubs/web/common/components/WarningInfo";
import useGetClubRegistrationDeadline from "@sparcs-clubs/web/features/clubs/services/useGetClubRegistrationDeadline";
import usePutClubRegistration from "@sparcs-clubs/web/features/my/services/usePutClubRegistration";
import ActivityReportFrame from "@sparcs-clubs/web/features/register-club/components/activity-report/ActivityReportFrame";
import AdvancedInformFrame from "@sparcs-clubs/web/features/register-club/components/advanced-info/AdvancedInformFrame";
import BasicInformFrame from "@sparcs-clubs/web/features/register-club/components/basic-info/BasicInformFrame";
import NewProvisionalBasicInformFrame from "@sparcs-clubs/web/features/register-club/components/basic-info/NewProvisionalBasicInformFrame";
import ReProvisionalBasicInformFrame from "@sparcs-clubs/web/features/register-club/components/basic-info/ReProvisionalBasicInformFrame";
import ClubRulesFrame from "@sparcs-clubs/web/features/register-club/components/compliance/ClubRulesFrame";
import { RegisterClubModel } from "@sparcs-clubs/web/features/register-club/types/registerClub";
import computeErrorMessage from "@sparcs-clubs/web/features/register-club/utils/computeErrorMessage";
import { getRegistrationErrorMessage } from "@sparcs-clubs/web/features/register-club/utils/getRegistrationErrorMessage";
import useGetSemesterNow from "@sparcs-clubs/web/utils/getSemesterNow";

interface RegisterClubMainFrameProps {
  applyId: number;
  initialData?: ApiReg011ResponseOk;
}

const ButtonWrapper = styled.div`
  display: flex;
  justify-content: space-between;
`;

// TODO. (refactor) RegisterClubForm 사용
const MyRegisterClubEditFrame: React.FC<RegisterClubMainFrameProps> = ({
  applyId,
  initialData,
}) => {
  const t = useTranslations("my.registration");
  const validationT = useTranslations("my.registration.validation");
  const errorT = useTranslations("my.registration.errors");
  const format = useFormatter();
  const semesterNames: Record<string, string> = {
    봄: t("spring"),
    가을: t("fall"),
  };
  const router = useRouter();
  const queryClient = useQueryClient();

  const [isAgreed, setIsAgreed] = useState(false);

  const {
    data: clubDeadline,
    isLoading,
    isError,
  } = useGetClubRegistrationDeadline();

  const formCtx = useForm<RegisterClubModel>({
    mode: "all",
    defaultValues: {
      ...initialData,
      clubNameKr: initialData?.newClubNameKr || initialData?.clubNameKr,
      clubNameEn: initialData?.newClubNameEn || initialData?.clubNameEn,
      phoneNumber: initialData?.representative.phoneNumber,
    },
  });

  const {
    watch,
    handleSubmit,
    formState: { isValid },
  } = formCtx;

  const formData = watch();

  const clubId = watch("clubId");
  const registrationTypeEnumId = watch("registrationTypeEnumId");
  const foundedAt = watch("foundedAt");
  const divisionId = watch("divisionId");

  const isFormValid =
    registrationTypeEnumId !== undefined &&
    foundedAt !== undefined &&
    divisionId !== undefined &&
    isValid;

  const errorMessage = useMemo(
    () => computeErrorMessage({ ...formData, isAgreed }, validationT),
    [formData, isAgreed, validationT],
  );

  const {
    mutate,
    isSuccess,
    isPending,
    error: registrationError,
  } = usePutClubRegistration();

  const type =
    initialData?.registrationTypeEnumId ?? RegistrationTypeEnum.NewProvisional;

  const existingClub = initialData?.clubId
    ? {
        id: initialData.clubId,
        clubNameKr: initialData.clubNameKr,
        clubNameEn: initialData.clubNameEn,
        professor: initialData.professor,
      }
    : undefined;

  const submitHandler = useCallback(
    (data: RegisterClubModel) => {
      mutate({
        requestParam: { applyId },
        body: {
          ...data,
          registrationTypeEnumId: type,
          clubId: initialData?.clubId,
          clubRuleFileId: data.clubRuleFile?.id,
          activityPlanFileId: data.activityPlanFile?.id,
          externalInstructionFileId: data.externalInstructionFile?.id,
        },
      });
    },
    [mutate, applyId, type, initialData?.clubId],
  );

  useEffect(() => {
    if (isSuccess) {
      router.replace(`/my/register-club/${applyId}`);
      queryClient.invalidateQueries({
        queryKey: [apiReg011.url(applyId.toString())],
      });
    }
  }, [isSuccess, router, applyId, queryClient]);

  const {
    semester: semesterInfo,
    isLoading: semesterLoading,
    isError: semesterError,
  } = useGetSemesterNow();

  if (!initialData) return null;

  return (
    <FormProvider {...formCtx}>
      <form onSubmit={handleSubmit(submitHandler)}>
        <FlexWrapper direction="column" gap={60}>
          <FlexWrapper direction="column" gap={20}>
            <AsyncBoundary
              isLoading={isLoading || semesterLoading}
              isError={isError || semesterError}
            >
              {clubDeadline?.deadline && (
                <Info
                  text={t("deadlineInfo", {
                    year: semesterInfo?.year ?? "",
                    semester:
                      semesterNames[semesterInfo?.name ?? ""] ??
                      semesterInfo?.name ??
                      "",
                    deadline: format.dateTime(
                      new Date(clubDeadline.deadline.endTerm),
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        weekday: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                        timeZone: "Asia/Seoul",
                      },
                    ),
                  })}
                />
              )}
            </AsyncBoundary>
            <WarningInfo>
              <Typography lh={24} color="BLACK">
                {t("typeChangeWarning")}
              </Typography>
            </WarningInfo>
          </FlexWrapper>
          {type === RegistrationTypeEnum.NewProvisional && (
            <NewProvisionalBasicInformFrame
              isInitialCheckedProfessor={initialData.professor != null}
              profile={{
                name: initialData.representative.name,
                phoneNumber: initialData.representative.phoneNumber,
              }}
            />
          )}
          {type === RegistrationTypeEnum.ReProvisional && (
            <ReProvisionalBasicInformFrame
              isInitialCheckedProfessor={initialData.professor != null}
              editMode
              existingClub={existingClub}
              profile={{
                name: initialData.representative.name,
                phoneNumber: initialData.representative.phoneNumber,
              }}
            />
          )}
          {(type === RegistrationTypeEnum.Renewal ||
            type === RegistrationTypeEnum.Promotional) && (
            <BasicInformFrame
              type={type}
              editMode
              existingClub={existingClub}
              profile={{
                name: initialData.representative.name,
                phoneNumber: initialData.representative.phoneNumber,
              }}
            />
          )}
          <AdvancedInformFrame
            type={type}
            files={{
              activityPlanFile: initialData?.activityPlanFile,
              clubRuleFile: initialData?.clubRuleFile,
              externalInstructionFile: initialData?.externalInstructionFile,
            }}
          />
          {type === RegistrationTypeEnum.Promotional && clubId && (
            <ActivityReportFrame
              clubId={clubId}
              semesterId={initialData?.semesterId}
            />
          )}
          <ClubRulesFrame
            isNewProvisional={type === RegistrationTypeEnum.NewProvisional}
            isAgreed={isAgreed}
            setIsAgreed={setIsAgreed}
          />
          {registrationError && (
            <Typography color="RED.600" role="alert">
              {getRegistrationErrorMessage(registrationError, errorT)}
            </Typography>
          )}
          <ButtonWrapper>
            <Button
              type="outlined"
              onClick={() => router.replace(`/my/register-club/${applyId}`)}
            >
              {t("cancel")}
            </Button>
            <FlexWrapper
              direction="row"
              gap={16}
              style={{ alignItems: "center" }}
            >
              {errorMessage && (
                <Typography color="RED.600" fs={12} lh={16}>
                  {errorMessage}
                </Typography>
              )}
              <Button
                buttonType="submit"
                type={
                  isFormValid &&
                  isAgreed &&
                  errorMessage === "" &&
                  !isPending &&
                  !isSuccess
                    ? "default"
                    : "disabled"
                }
              >
                {isPending ? t("saving") : t("save")}
              </Button>
            </FlexWrapper>
          </ButtonWrapper>
        </FlexWrapper>
      </form>
    </FormProvider>
  );
};

export default MyRegisterClubEditFrame;
