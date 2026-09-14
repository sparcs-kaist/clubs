import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { overlay } from "overlay-kit";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import styled from "styled-components";

import apiReg012 from "@clubs/interface/api/registration/endpoint/apiReg012";
import apiReg025 from "@clubs/interface/api/registration/endpoint/apiReg025";
import { RegistrationTypeEnum } from "@clubs/interface/common/enum/registration.enum";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import Button from "@sparcs-clubs/web/common/components/Button";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import Modal from "@sparcs-clubs/web/common/components/Modal";
import ConfirmModalContent from "@sparcs-clubs/web/common/components/Modal/ConfirmModalContent";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import useGetUserProfile from "@sparcs-clubs/web/common/services/getUserProfile";
import LocalStorageUtil from "@sparcs-clubs/web/common/services/localStorageUtil";
import { isObjectEmpty } from "@sparcs-clubs/web/utils";

import useRegisterClub from "../services/useRegisterClub";
import { RegisterClubModel } from "../types/registerClub";
import computeErrorMessage from "../utils/computeErrorMessage";
import { getRegistrationErrorMessage } from "../utils/getRegistrationErrorMessage";
import { getRegisterClubDraftKey } from "../utils/registrationDraft";
import ActivityReportFrame from "./activity-report/ActivityReportFrame";
import AdvancedInformFrame from "./advanced-info/AdvancedInformFrame";
import BasicInformFrame from "./basic-info/BasicInformFrame";
import NewProvisionalBasicInformFrame from "./basic-info/NewProvisionalBasicInformFrame";
import ReProvisionalBasicInformFrame from "./basic-info/ReProvisionalBasicInformFrame";
import ClubRulesFrame from "./compliance/ClubRulesFrame";

interface RegisterClubFormProps {
  type: RegistrationTypeEnum;
  initialData?: RegisterClubModel;
}

const ButtonWrapper = styled.div`
  display: flex;
  justify-content: space-between;
`;

const RegisterClubForm: React.FC<RegisterClubFormProps> = ({
  type,
  initialData = undefined,
}) => {
  const queryClient = useQueryClient();

  const router = useRouter();
  const [isAgreed, setIsAgreed] = useState(false);

  const {
    data: profile,
    isLoading: isLoadingProfile,
    isError: isErrorProfile,
  } = useGetUserProfile();

  const formCtx = useForm<RegisterClubModel>({
    mode: "all",
    defaultValues: {
      ...initialData,
      registrationTypeEnumId: type,
      clubId:
        type === RegistrationTypeEnum.NewProvisional
          ? undefined
          : initialData?.clubId,
      phoneNumber: initialData?.phoneNumber ?? profile?.phoneNumber,
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
    () =>
      computeErrorMessage({
        ...formData,
        isAgreed,
      }),
    [formData, isAgreed],
  );

  const {
    data: registrationData,
    mutate: registerClubApi,
    error: registrationError,
    isPending,
    isSuccess,
    isError,
  } = useRegisterClub();

  const isProvisionalClub =
    type === RegistrationTypeEnum.NewProvisional ||
    type === RegistrationTypeEnum.ReProvisional;

  const ProvisionalInfoFrame =
    type === RegistrationTypeEnum.NewProvisional
      ? NewProvisionalBasicInformFrame
      : ReProvisionalBasicInformFrame;

  const submitHandler = useCallback(
    (data: RegisterClubModel, event?: React.BaseSyntheticEvent) => {
      // Eligibility may change while react-hook-form awaits validation.
      const form = event?.target;
      if (form instanceof HTMLFormElement && form.closest("fieldset")?.disabled)
        return;
      registerClubApi({
        body: {
          ...data,
          registrationTypeEnumId: type,
          clubId:
            type === RegistrationTypeEnum.NewProvisional
              ? undefined
              : data.clubId,
          clubRuleFileId:
            type === RegistrationTypeEnum.Promotional
              ? data.clubRuleFile?.id
              : undefined,
          activityPlanFileId: data.activityPlanFile?.id,
          externalInstructionFileId: data.externalInstructionFile?.id,
        },
      });
    },
    [registerClubApi, type],
  );

  useEffect(() => {
    if (!isSuccess && !isObjectEmpty(formData)) {
      LocalStorageUtil.save(getRegisterClubDraftKey(type), formData);
    }
  }, [formData, isSuccess, type]);

  useEffect(() => {
    if (isSuccess) {
      overlay.open(({ isOpen, close }) => (
        <Modal isOpen={isOpen}>
          <ConfirmModalContent
            onConfirm={() => {
              queryClient.invalidateQueries({
                queryKey: [apiReg012.url()],
              });
              queryClient.invalidateQueries({
                queryKey: [apiReg025.url()],
              });
              close();
              router.push(`/my/register-club/${registrationData.id}`);
              LocalStorageUtil.remove(getRegisterClubDraftKey(type));
            }}
          >
            신청이 완료되었습니다.
            <br />
            확인을 누르면 신청 내역 화면으로 이동합니다.
          </ConfirmModalContent>
        </Modal>
      ));
      return;
    }
    if (isError) {
      overlay.open(({ isOpen, close }) => (
        <Modal isOpen={isOpen}>
          <ConfirmModalContent
            onConfirm={() => {
              close();
            }}
          >
            {getRegistrationErrorMessage(registrationError)}
          </ConfirmModalContent>
        </Modal>
      ));
    }
  }, [
    isSuccess,
    isError,
    registrationError,
    registrationData,
    queryClient,
    router,
    type,
  ]);

  return (
    <FormProvider {...formCtx}>
      <form onSubmit={handleSubmit(submitHandler)}>
        <FlexWrapper direction="column" gap={60}>
          <AsyncBoundary isLoading={isLoadingProfile} isError={isErrorProfile}>
            {isProvisionalClub ? (
              <ProvisionalInfoFrame
                isInitialCheckedProfessor={initialData?.professor != null}
                profile={
                  profile
                    ? { name: profile.name, phoneNumber: profile.phoneNumber }
                    : undefined
                }
              />
            ) : (
              <BasicInformFrame
                type={type}
                profile={
                  profile
                    ? { name: profile.name, phoneNumber: profile.phoneNumber }
                    : undefined
                }
              />
            )}
          </AsyncBoundary>
          <AdvancedInformFrame
            type={type}
            files={{
              activityPlanFile: initialData?.activityPlanFile,
              clubRuleFile: initialData?.clubRuleFile,
              externalInstructionFile: initialData?.externalInstructionFile,
            }}
          />
          {type === RegistrationTypeEnum.Promotional && clubId && (
            <ActivityReportFrame clubId={clubId} />
          )}
          <ClubRulesFrame
            isNewProvisional={type === RegistrationTypeEnum.NewProvisional}
            isAgreed={isAgreed}
            setIsAgreed={setIsAgreed}
          />

          <ButtonWrapper>
            <Button
              type="outlined"
              onClick={() => router.replace("/register-club")}
            >
              취소
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
                {isPending ? "신청 중" : "신청"}
              </Button>
            </FlexWrapper>
          </ButtonWrapper>
        </FlexWrapper>
      </form>
    </FormProvider>
  );
};

export default RegisterClubForm;
