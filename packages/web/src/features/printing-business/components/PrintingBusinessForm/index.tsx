import React, { useCallback, useState } from "react";
import styled from "styled-components";

import type {
  ApiPrt002RequestBody,
  ApiPrt002RequestParam,
} from "@clubs/interface/api/promotional-printing/endpoint/apiPrt002";

import Button from "@sparcs-clubs/web/common/components/Button";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import StepProcess from "@sparcs-clubs/web/common/components/StepProcess/StepProcess";
import { printingBusinessOrderSteps } from "@sparcs-clubs/web/constants/printingBusiness";

import PrintingBusinessFormFirst from "./PrintingBusinessFormFirst";
import PrintingBusinessFormSecond from "./PrintingBusinessFormSecond";
import PrintingBusinessFormThird from "./PrintingBusinessFormThird";

interface PrintingBusinessFormProps {
  username: string;
  clubs: Array<{
    id: ApiPrt002RequestParam["clubId"];
    nameKr: string;
    nameEn: string;
  }>;
  setAgreement: React.Dispatch<React.SetStateAction<boolean>>;
  step: number;
  setStep: React.Dispatch<React.SetStateAction<number>>;
  requestParam: Partial<ApiPrt002RequestParam>;
  setRequestParam: React.Dispatch<
    React.SetStateAction<Partial<ApiPrt002RequestParam>>
  >;
  requestForm: Partial<ApiPrt002RequestBody>;
  setRequestForm: React.Dispatch<
    React.SetStateAction<Partial<ApiPrt002RequestBody>>
  >;
}

const StyledButton = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  align-self: stretch;
`;

// step은 1부터 시작하기에, 놓치지 말고 인덱싱 잘하기!
const Step2Form = [
  PrintingBusinessFormFirst,
  PrintingBusinessFormSecond,
  PrintingBusinessFormThird,
];

const PrintingBusinessForm: React.FC<PrintingBusinessFormProps> = ({
  username,
  clubs,
  setAgreement,
  step,
  setStep,
  requestParam,
  setRequestParam,
  requestForm,
  setRequestForm,
}) => {
  const CurrentForm = Step2Form[step - 1];

  const onPrev = useCallback(() => {
    if (step === 1) {
      setAgreement(false);
      return;
    }
    setStep(step - 1);
  }, [setAgreement, step, setStep]);

  const onNext = useCallback(() => {
    if (step === Step2Form.length) {
      return;
    }
    setStep(step + 1);
  }, [step, setStep]);

  const [formError, setFormError] = useState<boolean>(false);

  return (
    <FlexWrapper direction="column" gap={60}>
      <StepProcess steps={printingBusinessOrderSteps} activeStepIndex={step} />
      <CurrentForm
        username={username}
        clubs={clubs}
        requestParam={requestParam}
        setRequestParam={setRequestParam}
        requestForm={requestForm}
        setRequestForm={setRequestForm}
        setFormError={setFormError}
      />
      <StyledButton>
        <Button onClick={onPrev}>이전</Button>
        <Button type={formError ? "disabled" : "default"} onClick={onNext}>
          {/* todo!: 신청 버튼 클릭시 신청이 POST되는 API 호출이 필요합니다. */}
          {step === Step2Form.length ? "신청" : "다음"}
        </Button>
      </StyledButton>
    </FlexWrapper>
  );
};

export default PrintingBusinessForm;

export type { PrintingBusinessFormProps };
