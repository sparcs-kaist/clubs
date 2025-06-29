import React, { ReactNode } from "react";
import styled from "styled-components";

import Icon from "@sparcs-clubs/web/common/components/Icon";
import colors from "@sparcs-clubs/web/styles/themes/colors";

interface BannerProps {
  icon: string;
  children: ReactNode;
}

const BannerInner = styled.div`
  display: flex;
  flex-direction: row;
  padding: 12px 16px;
  gap: 8px;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.colors.PRIMARY};
  background-color: ${({ theme }) => theme.colors.MINT[100]};
  white-space: pre-line;
  font-size: 16px;
  line-height: 24px;
  font-weight: ${({ theme }) => theme.fonts.WEIGHT.MEDIUM};
`;

const Banner: React.FC<BannerProps> = ({ icon, children }) => (
  <BannerInner>
    <Icon type={icon} size={24} color={colors.PRIMARY} />
    {children}
  </BannerInner>
);

export default Banner;
