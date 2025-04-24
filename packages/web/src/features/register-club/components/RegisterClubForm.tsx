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
import { LOCAL_STORAGE_KEY } from "@sparcs-clubs/web/constants/localStorage";
import { isObjectEmpty } from "@sparcs-clubs/web/utils";

import useRegisterClub from "../services/useRegisterClub";
import { RegisterClubModel } from "../types/registerClub";
import computeErrorMessage from "../utils/computeErrorMessage";
import ActivityReportFrame from "./activity-report/ActivityReportFrame";
import AdvancedInformFrame from "./advanced-info/AdvancedInformFrame";
import BasicInformFrame from "./basic-info/BasicInformFrame";
import ProvisionalBasicInformFrame from "./basic-info/ProvisionalBasicInformFrame";
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
    isSuccess,
    isError,
  } = useRegisterClub();

  const isProvisionalClub =
    type === RegistrationTypeEnum.NewProvisional ||
    type === RegistrationTypeEnum.ReProvisional;

  const submitHandler = useCallback(
    (data: RegisterClubModel) => {
      // logger.debug("submit", data);
      registerClubApi({
        body: {
          ...data,
          clubRuleFileId: data.clubRuleFile?.id,
          activityPlanFileId: data.activityPlanFile?.id,
          externalInstructionFileId: data.externalInstructionFile?.id,
        },
      });
    },
    [registrationData, isSuccess, isError],
  );

  useEffect(() => {
    if (!isObjectEmpty(formData)) {
      LocalStorageUtil.save(LOCAL_STORAGE_KEY.REGISTER_CLUB, formData);
    }
  }, [formData]);

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
              LocalStorageUtil.remove(LOCAL_STORAGE_KEY.REGISTER_CLUB);
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
      /* 
        TODO: (@dora)
        원래 useGetClubDetail()을 통해 clubName을 가져와서 
        "{clubName} 동아리 등록 신청이 이미 존재하여 등록 신청을 할 수 없습니다."라고 표시해주었는데,
        해당 API 호출에 이슈가 있어서 clubName에 대한 부분을 임시로 빼둔 상태
        그리고 에러 케이스가 다양해지면서 그냥 문구를 퉁쳐버림...
      */
      overlay.open(({ isOpen, close }) => (
        <Modal isOpen={isOpen}>
          <ConfirmModalContent
            onConfirm={() => {
              close();
            }}
          >
            해당 동아리에 대한 등록 신청이 이미 존재하거나,
            <br />
            이미 등록 신청 기록이 있거나,
            <br />
            지도교수를 입력하지 않아
            <br />
            등록 신청을 할 수 없습니다.
          </ConfirmModalContent>
        </Modal>
      ));
    }
  }, [isSuccess, isError]);

  return (
    <FormProvider {...formCtx}>
      <form onSubmit={handleSubmit(submitHandler)}>
        <FlexWrapper direction="column" gap={60}>
          <AsyncBoundary isLoading={isLoadingProfile} isError={isErrorProfile}>
            {isProvisionalClub ? (
              <ProvisionalBasicInformFrame
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
                  isFormValid && isAgreed && errorMessage === ""
                    ? "default"
                    : "disabled"
                }
              >
                신청
              </Button>
            </FlexWrapper>
          </ButtonWrapper>
        </FlexWrapper>
      </form>
    </FormProvider>
  );
};

export default RegisterClubForm;
