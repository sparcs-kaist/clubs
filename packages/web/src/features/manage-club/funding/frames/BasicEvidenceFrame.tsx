import React from "react";
import { useFormContext } from "react-hook-form";

import Card from "@sparcs-clubs/web/common/components/Card";
import FileUpload from "@sparcs-clubs/web/common/components/FileUpload";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import FoldableSectionTitle from "@sparcs-clubs/web/common/components/FoldableSectionTitle";
import FormController from "@sparcs-clubs/web/common/components/FormController";
import TextInput from "@sparcs-clubs/web/common/components/Forms/TextInput";
import Typography from "@sparcs-clubs/web/common/components/Typography";

import { BasicEvidence } from "../types/funding";

const BasicEvidenceFrame: React.FC = () => {
  const formCtx = useFormContext<BasicEvidence>();
  const { control, watch, setValue } = formCtx;

  const evidenceFiles = watch("tradeEvidenceFiles");
  const detailFiles = watch("tradeDetailFiles");

  return (
    <FoldableSectionTitle title="필수 증빙">
      <Card outline gap={32}>
        <FlexWrapper direction="column" gap={4}>
          <Typography ff="PRETENDARD" fw="MEDIUM" fs={16} lh={20} color="BLACK">
            거래 사실 증빙
          </Typography>
          <FormController
            name="tradeEvidenceFiles"
            required
            control={control}
            renderItem={props => (
              <FileUpload
                {...props}
                multiple
                fileId="tradeEvidenceFiles"
                initialFiles={evidenceFiles}
                onChange={files =>
                  setValue("tradeEvidenceFiles", files, {
                    shouldValidate: true,
                  })
                }
              />
            )}
          />
        </FlexWrapper>
        <FlexWrapper direction="column" gap={4}>
          <Typography ff="PRETENDARD" fw="MEDIUM" fs={16} lh={20} color="BLACK">
            거래 세부항목 증빙
          </Typography>
          <FormController
            name="tradeDetailExplanation"
            required
            control={control}
            renderItem={props => (
              <TextInput
                {...props}
                placeholder="거래 세부항목 증빙을 입력하세요"
                helperText="한 영수증의 서로 다른 품목은 각각 신청하고, 해당 품목이 보이는 거래명세를 첨부해 주세요. 지출 금액에는 이 품목에 해당하는 배송비를 포함할 수 있습니다."
                area
              />
            )}
          />
          <FormController
            name="tradeDetailFiles"
            required
            control={control}
            renderItem={props => (
              <FileUpload
                {...props}
                fileId="tradeDetailFiles"
                multiple
                initialFiles={detailFiles}
                onChange={files =>
                  setValue("tradeDetailFiles", files, {
                    shouldValidate: true,
                  })
                }
              />
            )}
          />
        </FlexWrapper>
      </Card>
    </FoldableSectionTitle>
  );
};
export default BasicEvidenceFrame;
