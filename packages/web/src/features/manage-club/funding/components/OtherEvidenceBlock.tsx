import { useTranslations } from "next-intl";
import React, { useState } from "react";

import Card from "@sparcs-clubs/web/common/components/Card";
import { FileDetail } from "@sparcs-clubs/web/common/components/File/attachment";
import FileUpload from "@sparcs-clubs/web/common/components/FileUpload";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import FormController from "@sparcs-clubs/web/common/components/FormController";
import TextInput from "@sparcs-clubs/web/common/components/Forms/TextInput";
import Typography from "@sparcs-clubs/web/common/components/Typography";

import EvidenceBlockTitle from "./EvidenceBlockTitle";

interface OtherEvidenceBlockProps {
  content: string;
  info?: string;
  explanationControlName: string;
  fileControlName: string;
  required?: boolean;
  fileOnChange: (files: FileDetail[]) => void;
  initialFiles: FileDetail[];
}

const EvidenceInfo = [
  {
    content: "식비",
    info: `* 합치하는 활동에서 필수적인 식음료는 활동 규모를 알 수 있는 사진 등의 소명 필요 \n* 합치하는 외부 활동에서 교내 구성원에게 제공한 음식은 명단 증빙 필요`,
  },
  {
    content: "근로 계약",
    info: "* 근로 계약은 계좌 이체를 제외한 현금 거래 불허, 근로 계약서 필요 강사/연사는 이력서&지도계획서&사진 필요",
  },
  {
    content: "외부 행사 참가비",
    info: "* 외부 행사의 참가비는 사진 및 참여 명단 증빙 필요",
  },
  {
    content: "발간물",
    info: "* 발간물은 발간 주체 및 목적 작성 필요, 오프라인으로 사본 제출 필수",
  },
  {
    content: "수익 사업",
    info: "* 수익 사업은 결산 및 행사 규모를 증명할 수 있는 자료 필요",
  },
  {
    content: "공동 경비",
    info: "* 공동 경비는 한 동아리가 증빙하면 다른 동아리들은 이를 언급하는 것으로 충분하며, 승인 금액은 동등 분배",
  },
];

const OtherEvidenceBlock: React.FC<OtherEvidenceBlockProps> = ({
  content,
  info = "",
  fileControlName,
  explanationControlName,
  required = false,
  fileOnChange,
  initialFiles,
}) => {
  const t = useTranslations("common");
  const [toggle, setToggle] = useState<boolean>(true);

  return (
    <FlexWrapper direction="column" gap={8}>
      <EvidenceBlockTitle
        title={`${content} 증빙`}
        toggle={toggle}
        toggleHandler={() => setToggle(!toggle)}
      >
        <Card outline>
          <FlexWrapper direction="column" gap={16}>
            <Typography
              ff="PRETENDARD"
              fw="REGULAR"
              fs={14}
              lh={20}
              color="GRAY.600"
              style={{ whiteSpace: "pre-wrap" }}
            >
              {EvidenceInfo.find(e => e.content === content)?.info || info}
              {content === "발간물" &&
                `\n* ${t("funding.publicationPhotoRequired")}`}
            </Typography>
            <FormController
              name={explanationControlName}
              required={required}
              renderItem={props => (
                <TextInput
                  {...props}
                  placeholder={`${content} 증빙을 입력하세요.`}
                  area
                />
              )}
            />
            <FormController
              name={fileControlName}
              required={required}
              renderItem={props => (
                <FileUpload
                  {...props}
                  fileId={fileControlName}
                  multiple
                  onChange={fileOnChange}
                  initialFiles={initialFiles}
                />
              )}
            />
          </FlexWrapper>
        </Card>
      </EvidenceBlockTitle>
    </FlexWrapper>
  );
};
export default OtherEvidenceBlock;
