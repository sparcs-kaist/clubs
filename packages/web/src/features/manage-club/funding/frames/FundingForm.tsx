import React, { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";

import Button from "@sparcs-clubs/web/common/components/Button";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import StyledBottom from "@sparcs-clubs/web/common/components/StyledBottom";

import { NO_ACTIVITY_REPORT_FUNDING } from "../constants";
import { FundingFormData } from "../types/funding";
import AddEvidenceFrame from "./AddEvidenceFrame";
import BasicEvidenceFrame from "./BasicEvidenceFrame";
import FundingInfoFrame from "./FundingInfoFrame";

interface FundingFormProps {
  clubId: number;
  initialData?: FundingFormData;
  onCancel: VoidFunction;
  onSubmit: (data: FundingFormData) => void;
  onFormDataChange?: (formData: FundingFormData) => void;
}

const FundingForm: React.FC<FundingFormProps> = ({
  clubId,
  initialData = undefined,
  onCancel,
  onSubmit,
  onFormDataChange,
}) => {
  const formCtx = useForm<FundingFormData>({
    mode: "all",
    defaultValues: {
      ...initialData,
      purposeActivity: {
        id: initialData
          ? (initialData.purposeActivity?.id ?? Infinity)
          : undefined,
        name: initialData
          ? (initialData.purposeActivity?.name ?? NO_ACTIVITY_REPORT_FUNDING)
          : undefined,
      },
    },
  });

  const {
    handleSubmit,
    formState: { isValid },
    watch,
  } = formCtx;

  // 폼 데이터 변경 감지
  const formData = watch();
  useEffect(() => {
    if (onFormDataChange) {
      onFormDataChange(formData);
    }
  }, [formData, onFormDataChange]);

  return (
    <FormProvider {...formCtx}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <FlexWrapper direction="column" gap={60}>
          <FundingInfoFrame clubId={clubId} />
          <BasicEvidenceFrame />
          <AddEvidenceFrame />
          <StyledBottom>
            <Button buttonType="button" type="outlined" onClick={onCancel}>
              취소
            </Button>
            <Button buttonType="submit" type={isValid ? "default" : "disabled"}>
              {initialData ? "저장" : "신청"}
            </Button>
          </StyledBottom>
        </FlexWrapper>
      </form>
    </FormProvider>
  );
};

export default FundingForm;
