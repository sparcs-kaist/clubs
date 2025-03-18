import React from "react";
import styled from "styled-components";

import Progress from "./Progress";
import {
  ProgressCheckSectionStatusEnum,
  StatusAndDate,
} from "./progressCheckStationStatus";
import ProgressLine from "./ProgressLine";

interface ProgressCheckSectionProps {
  labels: string[];
  progress: StatusAndDate[];
}

const ProgressCheckSectionWrapper = styled.div`
  display: flex;
  flex-direction: row;
  gap: 4px;
  align-items: flex-start;
  height: 76px;
  width: 100%;
  padding: 0 48px;
`;

const ProgressLineWrapper = styled.div`
  display: flex;
  flex: 1;
  margin-top: 12px;
`;

const ProgressCheckSection: React.FC<ProgressCheckSectionProps> = ({
  labels,
  progress,
}) => (
  <ProgressCheckSectionWrapper>
    {labels.map((label, index) => (
      <React.Fragment key={String(index) + label}>
        <Progress
          status={
            progress[index]
              ? progress[index].status
              : ProgressCheckSectionStatusEnum.Pending
          }
          label={label}
          date={progress[index] ? progress[index].date : undefined}
        />
        {index < labels.length - 1 && (
          <ProgressLineWrapper>
            <ProgressLine
              status={
                progress[index + 1]
                  ? progress[index].status
                  : ProgressCheckSectionStatusEnum.Pending
              }
            />
          </ProgressLineWrapper>
        )}
      </React.Fragment>
    ))}
  </ProgressCheckSectionWrapper>
);
export default ProgressCheckSection;
