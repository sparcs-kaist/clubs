import React, { useState } from "react";
import styled from "styled-components";

import Typography from "@sparcs-clubs/web/common/components/Typography";
import colors from "@sparcs-clubs/web/styles/themes/colors";

import Icon from "./Icon";

interface TooltipProps {
  text: string;
}

const ResponsiveTypography = styled(Typography)`
  display: flex;
  max-width: 300px;
  padding: 4px 8px;
  justify-content: center;
  align-items: center;
  overflow-wrap: anywhere;

  border-radius: 4px;
  border: 1px solid var(--gray200, #eee);
  background: var(--white, #fff);

  position: absolute;
  top: 24px;
  left: 12px;
  transform: translate(-50%, 0);

  font-size: 16px;
  line-height: 24px;

  @media (max-width: ${({ theme }) => theme.responsive.BREAKPOINT.sm}) {
    font-size: 14px;
    line-height: 20px;
  }
`;

const ResponsiveIcon = styled(Icon)`
  font-size: 20px !important;

  @media (max-width: ${({ theme }) => theme.responsive.BREAKPOINT.sm}) {
    font-size: 16px !important;
  }
`;

const IconWrapper = styled.div`
  height: 24px;
  width: 24px;

  position: relative;

  @media (max-width: ${({ theme }) => theme.responsive.BREAKPOINT.sm}) {
    height: 20px;
  }
  display: flex;
  align-items: center;
`;

const TooltipWrapper = styled.div`
  position: relative;
  width: 300px;
`;

const Tooltip: React.FC<TooltipProps> = ({ text }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <TooltipWrapper>
      <IconWrapper
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <ResponsiveIcon
          type="info"
          size={20}
          color={isHovered ? colors.BLACK : colors.GRAY[600]}
        />
      </IconWrapper>
      {isHovered && (
        <ResponsiveTypography fw="REGULAR">{text}</ResponsiveTypography>
      )}
    </TooltipWrapper>
  );
};
export default Tooltip;
