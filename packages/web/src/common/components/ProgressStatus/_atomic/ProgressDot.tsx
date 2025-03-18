import styled from "styled-components";

import Icon from "@sparcs-clubs/web/common/components/Icon";

import { ProgressCheckSectionStatusEnum } from "./progressCheckStationStatus";

const ProgressDotBack = styled.div<{ status: ProgressCheckSectionStatusEnum }>`
  display: flex;
  width: 24px;
  height: 24px;
  justify-content: center;
  align-items: center;
  gap: 8px;
  border-radius: 12px;
  border: ${props =>
    props.status === ProgressCheckSectionStatusEnum.Pending
      ? `2px solid ${props.theme.colors.GRAY[300]}`
      : "none"};
  background-color: ${props => {
    switch (props.status) {
      case ProgressCheckSectionStatusEnum.Approved:
        return props.theme.colors.PRIMARY;
      case ProgressCheckSectionStatusEnum.Canceled:
        return props.theme.colors.RED[600];
      case ProgressCheckSectionStatusEnum.Pending:
      default:
        return props.theme.colors.WHITE;
    }
  }};
`;

const ProgressDot = ({
  status,
}: {
  status: ProgressCheckSectionStatusEnum;
}) => (
  <ProgressDotBack status={status}>
    {status === ProgressCheckSectionStatusEnum.Approved && (
      <Icon type="check" color="white" size={16} />
    )}
    {status === ProgressCheckSectionStatusEnum.Canceled && (
      <Icon type="close" color="white" size={16} />
    )}
  </ProgressDotBack>
);

export default ProgressDot;
