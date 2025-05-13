import React, { useEffect, useRef } from "react";
import { FormProvider, useForm } from "react-hook-form";

import Button from "@sparcs-clubs/web/common/components/Button";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import StyledBottom from "@sparcs-clubs/web/common/components/StyledBottom";
import LocalStorageUtil from "@sparcs-clubs/web/common/services/localStorageUtil";
import { LOCAL_STORAGE_KEY } from "@sparcs-clubs/web/constants/localStorage";
import { isObjectEmpty, objectDeepCompare } from "@sparcs-clubs/web/utils";

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
}

const FundingForm: React.FC<FundingFormProps> = ({
  clubId,
  initialData = undefined,
  onCancel,
  onSubmit,
}) => {
  const defaultValues: FundingFormData = {
    ...initialData,
    purposeActivity: {
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
    watch,
  } = formCtx;

  // 폼 데이터 변경 감지
  const initialRender = useRef(true);
  const previousValues = useRef<FundingFormData>(defaultValues);

  const formData = watch();

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
