import styled from "styled-components";

import { ProgressCheckSectionStatusEnum } from "./progressCheckStationStatus";

const ProgressLine = styled.div<{ status: ProgressCheckSectionStatusEnum }>`
  display: flex;
  height: 2px;
  flex: 1;
  border-radius: 0;
  background-color: ${props => {
    switch (props.status) {
      case ProgressCheckSectionStatusEnum.Approved:
        return props.theme.colors.PRIMARY;
      case ProgressCheckSectionStatusEnum.Canceled:
        return props.theme.colors.RED[600];
      case ProgressCheckSectionStatusEnum.Pending:
        return props.theme.colors.GRAY[300];
      default:
        return props.theme.colors.GRAY[300];
    }
  }};
`;

export default ProgressLine;
