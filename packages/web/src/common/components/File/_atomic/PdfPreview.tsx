import React from "react";
import styled from "styled-components";

import noPreview from "@sparcs-clubs/web/assets/no-preview.png";
import Icon from "@sparcs-clubs/web/common/components/Icon";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import colors from "@sparcs-clubs/web/styles/themes/colors";

import { FileDetail } from "../attachment";

interface PdfPreviewProps {
  file: FileDetail;
}

const PdfPreviewWrapper = styled.div`
  background-color: ${({ theme }) => theme.colors.GRAY[100]};
  border: 1px solid ${({ theme }) => theme.colors.GRAY[200]};
  border-radius: 8px;
  width: 160px;
  height: 160px;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  gap: 8px;
`;

const PdfPreview: React.FC<PdfPreviewProps> = ({ file }) => (
  <PdfPreviewWrapper>
    <Icon type="picture_as_pdf" size={28} color={colors.RED[600]} />
    <Typography fs={14} lh={16} color="GRAY.300">
      PDF 미리보기
      <img src={noPreview.src} alt={file.name} style={{ display: "none" }} />
    </Typography>
  </PdfPreviewWrapper>
);

export default PdfPreview;
