import React, { useEffect, useRef } from "react";
import { FormProvider, useForm } from "react-hook-form";

import { ActivityTypeEnum } from "@clubs/interface/common/enum/activity.enum";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import Button from "@sparcs-clubs/web/common/components/Button";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import StyledBottom from "@sparcs-clubs/web/common/components/StyledBottom";
import LocalStorageUtil from "@sparcs-clubs/web/common/services/localStorageUtil";
import { LOCAL_STORAGE_KEY } from "@sparcs-clubs/web/constants/localStorage";
import useGetActivityAvailable from "@sparcs-clubs/web/features/activity-report/services/useGetActivityAvailable";
import { isObjectEmpty, objectDeepCompare } from "@sparcs-clubs/web/utils";

import { NO_ACTIVITY_REPORT_FUNDING } from "../constants";
import { FundingFormData } from "../types/funding";
import AddEvidenceFrame from "./AddEvidenceFrame";
import BasicEvidenceFrame from "./BasicEvidenceFrame";
import FundingInfoFrame from "./FundingInfoFrame";

interface FundingFormProps {
  clubId: number;
  initialData?: FundingFormData;
  lockedName?: string;
  onCancel: VoidFunction;
  onSubmit: (data: FundingFormData) => void;
}

const FundingForm: React.FC<FundingFormProps> = ({
  clubId,
  initialData = undefined,
  lockedName = undefined,
  onCancel,
  onSubmit,
}) => {
  const defaultValues: FundingFormData = {
    ...initialData,
    name: lockedName ?? initialData?.name,
    purposeActivity: {
      ...initialData?.purposeActivity,
      id: initialData?.purposeActivity?.id ?? Infinity,
      name: initialData?.purposeActivity?.name ?? NO_ACTIVITY_REPORT_FUNDING,
    },
  } as FundingFormData;

  const formCtx = useForm<FundingFormData>({
    mode: "all",
    defaultValues,
  });

  const {
    handleSubmit,
    formState: { isValid },
    setValue,
    watch,
  } = formCtx;

  // 폼 데이터 변경 감지
  const initialRender = useRef(true);
  const previousValues = useRef<FundingFormData>(defaultValues);

  const formData = watch();
  const {
    data: availableActivities,
    isLoading: isLoadingActivities,
    isError: isErrorActivities,
  } = useGetActivityAvailable({ clubId });
  const purposeActivities = availableActivities?.activities ?? [];
  const selectedPurposeId = formData.purposeActivity?.id;
  const selectedPurpose =
    purposeActivities.find(activity => activity.id === selectedPurposeId) ??
    (initialData?.purposeActivity?.id === selectedPurposeId
      ? initialData?.purposeActivity
      : undefined);
  const isFoodExpenseBlocked =
    selectedPurpose?.activityTypeEnum === ActivityTypeEnum.notMatchedActivity;

  useEffect(() => {
    if (lockedName !== undefined) {
      setValue("name", lockedName, { shouldValidate: true });
    }
  }, [lockedName, setValue]);

  useEffect(() => {
    if (initialRender.current) {
      initialRender.current = false;
      return;
    }

    if (
      !isObjectEmpty(formData) &&
      objectDeepCompare(formData, previousValues.current)
    ) {
      LocalStorageUtil.save(LOCAL_STORAGE_KEY.CREATE_FUNDING, formData);
      previousValues.current = formData;
    }
  }, [formData]);

  const isValidEvidence = !isFoodExpenseBlocked || !formData.isFoodExpense;
  const handleFundingSubmit = (data: FundingFormData) => {
    if (isFoodExpenseBlocked && data.isFoodExpense) return;
    onSubmit(data);
  };

  return (
    <AsyncBoundary isLoading={isLoadingActivities} isError={isErrorActivities}>
      <FormProvider {...formCtx}>
        <form onSubmit={handleSubmit(handleFundingSubmit)}>
          <FlexWrapper direction="column" gap={60}>
            <FundingInfoFrame
              purposeActivities={purposeActivities}
              isNameLocked={lockedName !== undefined}
            />
            <BasicEvidenceFrame />
            <AddEvidenceFrame isFoodExpenseBlocked={isFoodExpenseBlocked} />
            <StyledBottom>
              <Button buttonType="button" type="outlined" onClick={onCancel}>
                취소
              </Button>
              <Button
                buttonType="submit"
                type={isValid && isValidEvidence ? "default" : "disabled"}
              >
                {initialData ? "저장" : "신청"}
              </Button>
            </StyledBottom>
          </FlexWrapper>
        </form>
      </FormProvider>
    </AsyncBoundary>
  );
};

export default FundingForm;
