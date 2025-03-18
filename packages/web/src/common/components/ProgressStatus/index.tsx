import React from "react";
import styled from "styled-components";

import Info from "@sparcs-clubs/web/common/components/Info";
import Typography from "@sparcs-clubs/web/common/components/Typography";

import ProgressCheckSection from "./_atomic/ProgressCheckSection";
import { StatusAndDate } from "./_atomic/progressCheckStationStatus";

interface ProgressStatusProps {
  title?: string;
  labels: string[];
  progress: StatusAndDate[];
  infoText?: string;
  optional?: React.ReactNode;
}

const ProgressCheckSectionWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 16px;
  align-items: flex-end;
`;

const ProgressStatus: React.FC<ProgressStatusProps> = ({
  title = "신청 상태",
  labels,
  progress,
  infoText = "",
  optional = undefined,
}) => (
  <ProgressCheckSectionWrapper>
    <Typography fw="MEDIUM" fs={16} lh={20} style={{ width: "100%" }}>
      {title}
    </Typography>
    <ProgressCheckSection labels={labels} progress={progress} />
    {infoText && <Info text={infoText} />}
    {optional}
    {/* TODO: onClick 달기 */}
  </ProgressCheckSectionWrapper>
);
export default ProgressStatus;
