import React, { useEffect, useState } from "react";
import styled from "styled-components";

import { PromotionalPrintingSizeEnum } from "@clubs/interface/common/enum/promotionalPrinting.enum";

import Card from "@sparcs-clubs/web/common/components/Card";
import FileUpload from "@sparcs-clubs/web/common/components/FileUpload";
import ItemNumberInput from "@sparcs-clubs/web/common/components/Forms/ItemNumberInput";
import Info from "@sparcs-clubs/web/common/components/Info";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import { leftoverPrintsInfoText } from "@sparcs-clubs/web/constants/printingBusiness";

import type { PrintingBusinessFormProps } from ".";
import BinaryRadio from "./_atomic/BinaryRadio";

type PrintingBusinessFormSecondProps = Pick<
  PrintingBusinessFormProps,
  "requestForm" | "setRequestForm"
> & { setFormError: React.Dispatch<React.SetStateAction<boolean>> };

const PrintingBusinessFormSecondInner = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 20px;
`;

const PrintingBusinessFormSecond: React.FC<PrintingBusinessFormSecondProps> = ({
  requestForm,
  setRequestForm,
  setFormError,
}) => {
  const [a3PrintCount, setA3PrintCount] = useState<number>(
    requestForm?.orders?.at(0)?.numberOfPrints ?? 0,
  );
  const [a4PrintCount, setA4PrintCount] = useState<number>(
    requestForm?.orders?.at(1)?.numberOfPrints ?? 0,
  );
  const [isColorPrint, setIsColorPrint] = useState<boolean>(
    requestForm.isColorPrint ?? true,
  );
  const [fitPrintSizeToPaper, setFitPrintSizeToPaper] = useState<boolean>(
    requestForm.fitPrintSizeToPaper ?? true,
  );
  const [requireMarginChopping, setRequireMarginChopping] = useState<boolean>(
    requestForm.requireMarginChopping ?? false,
  );

  useEffect(() => {
    setRequestForm({
      ...requestForm,
      isColorPrint,
      fitPrintSizeToPaper,
      requireMarginChopping,
      orders: [
        {
          promotionalPrintingSizeEnum: PromotionalPrintingSizeEnum.A3,
          numberOfPrints: a3PrintCount,
        },
        {
          promotionalPrintingSizeEnum: PromotionalPrintingSizeEnum.A4,
          numberOfPrints: a4PrintCount,
        },
      ],
    });

    setFormError(a3PrintCount === 0 && a4PrintCount === 0);
  }, [
    a3PrintCount,
    a4PrintCount,
    isColorPrint,
    fitPrintSizeToPaper,
    requireMarginChopping,
  ]);

  return (
    <PrintingBusinessFormSecondInner>
      {/* todo!: 이후 동아리의 홍보물 인쇄가능 매수 확인 API 추가후 수정이 필요합니다. */}
      <Info text={leftoverPrintsInfoText("술박스", 45, 45)} />
      <Card outline gap={20}>
        <Typography>인쇄 매수</Typography>
        <ItemNumberInput
          label="A3"
          placeholder="A3 크기로 인쇄하고 싶은 매수를 적어 주세요"
          itemLimit={45}
          unit="매"
          value={a3PrintCount}
          onChange={value => {
            setA3PrintCount(Number(value));
          }}
        />
        <ItemNumberInput
          label="A4"
          placeholder="A4 크기로 인쇄하고 싶은 매수를 적어 주세요"
          itemLimit={45}
          unit="매"
          value={a4PrintCount}
          onChange={value => {
            setA4PrintCount(Number(value));
          }}
        />
      </Card>
      <Card outline gap={20}>
        <Typography>인쇄 설정</Typography>
        <BinaryRadio
          label="색상"
          firstOptionLabel="컬러"
          secondOptionLabel="흑백"
          isFirstOptionSelected={isColorPrint}
          setIsFirstOptionSelected={setIsColorPrint}
        />
        <BinaryRadio
          label="크기"
          firstOptionLabel="용지에 맞춤"
          secondOptionLabel="원본 크기 그대로"
          isFirstOptionSelected={fitPrintSizeToPaper}
          setIsFirstOptionSelected={setFitPrintSizeToPaper}
        />
        <BinaryRadio
          label="마무리 작업"
          firstOptionLabel="그대로"
          secondOptionLabel="흰 테두리 재단"
          isFirstOptionSelected={!requireMarginChopping}
          setIsFirstOptionSelected={value => setRequireMarginChopping(!value)}
        />
      </Card>
      <Card outline gap={20}>
        <Typography>인쇄 파일 업로드</Typography>
        {/* todo!: 파일 업로드 api 완성 이후 적용이 필요합니다. */}
        <FileUpload />
      </Card>
    </PrintingBusinessFormSecondInner>
  );
};

export default PrintingBusinessFormSecond;
