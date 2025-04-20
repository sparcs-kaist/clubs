import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
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
import ProvisionalBasicInformFrame from "@sparcs-clubs/web/features/register-club/components/basic-info/ProvisionalBasicInformFrame";
import ClubRulesFrame from "@sparcs-clubs/web/features/register-club/components/compliance/ClubRulesFrame";
import { registerClubDeadlineInfoText } from "@sparcs-clubs/web/features/register-club/constants";
import { RegisterClubModel } from "@sparcs-clubs/web/features/register-club/types/registerClub";
import computeErrorMessage from "@sparcs-clubs/web/features/register-club/utils/computeErrorMessage";
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
      phoneNumber: initialData?.representative.phoneNumber,
    },
  });

  const {
    watch,
    setValue,
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
    () => computeErrorMessage({ ...formData, isAgreed }),
    [formData, isAgreed],
  );

  const { mutate, isSuccess } = usePutClubRegistration();

  const type =
    initialData?.registrationTypeEnumId ?? RegistrationTypeEnum.NewProvisional;

  const isProvisionalClub =
    type === RegistrationTypeEnum.NewProvisional ||
    type === RegistrationTypeEnum.ReProvisional;

  const submitHandler = useCallback(
    (data: RegisterClubModel) => {
      mutate({
        requestParam: { applyId },
        body: {
          ...data,
          clubRuleFileId: data.clubRuleFile?.id,
          activityPlanFileId: data.activityPlanFile?.id,
          externalInstructionFileId: data.externalInstructionFile?.id,
        },
      });
    },
    [mutate, applyId],
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

  useEffect(() => {
    // 현재 신청 할 때엔 clubName만 사용하고 상세조회로 받을 때엔 clubName, newClubName 나눠서 받아서 야매로 처리함
    // hook form에 동아리명, 신규 동아리명 모두 clubName으로 되어 있어서 발생한 문제
    // 프론트에서 정의한 타입 RegisterClubModel에 newClubName 을 추가하든, 신청 api에서 두개 나눠서 보내도록 변경하든 해야 함
    // 첫번째 조건: 신규가등록일 때 데이터가 newClubName으로 옴
    // 두번째 조건: 그 외의 타입에서 만약 동아리명 변경 체크박스를 선택한 경우(newClubName이 존재할 경우)
    if (
      (initialData &&
        registrationTypeEnumId === RegistrationTypeEnum.NewProvisional &&
        initialData.clubNameKr == null) ||
      (initialData.newClubNameKr !== null &&
        initialData.newClubNameKr.length > 0)
    ) {
      setValue("clubNameKr", initialData.newClubNameKr);
      setValue("clubNameEn", initialData.newClubNameEn);
    }
  }, [
    initialData.clubNameKr,
    initialData.newClubNameKr,
    registrationTypeEnumId,
  ]);

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
                  text={registerClubDeadlineInfoText(
                    clubDeadline.deadline.endTerm,
                    semesterInfo,
                  )}
                />
              )}
            </AsyncBoundary>
            <WarningInfo>
              <Typography lh={24} color="BLACK">
                동아리 등록 구분(재등록 / 신규 등록 / 가등록) 변경 또는 가등록
                신청 구분 변경을 원할 경우, 해당 신청 내역을 삭제한 후 새로운
                신청을 해주시기 바랍니다
              </Typography>
            </WarningInfo>
          </FlexWrapper>
          {isProvisionalClub ? (
            <ProvisionalBasicInformFrame
              isInitialCheckedProfessor={initialData.professor != null}
              editMode
              profile={{
                name: initialData.representative.name,
                phoneNumber: initialData.representative.phoneNumber,
              }}
            />
          ) : (
            <BasicInformFrame
              type={type}
              editMode
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
              onClick={() => router.replace(`/my/register-club/${applyId}`)}
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
                저장
              </Button>
            </FlexWrapper>
          </ButtonWrapper>
        </FlexWrapper>
      </form>
    </FormProvider>
  );
};

export default MyRegisterClubEditFrame;
