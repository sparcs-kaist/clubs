import { useRouter } from "next/navigation";
import React from "react";
import styled from "styled-components";

import Icon from "@sparcs-clubs/web/common/components/Icon";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import colors from "@sparcs-clubs/web/styles/themes/colors";

const DashboardButtonWrapper = styled.div`
  padding: 12px 20px;
  border-radius: 8px;
  background-color: ${({ theme }) => theme.colors.WHITE};
  box-shadow: ${({ theme }) => theme.shadow.md};
  gap: 20px;
  flex-direction: row;
  display: flex;
  justify-content: space-between;
  cursor: pointer;
`;

const DashboardButton: React.FC<{
  link: string;
  text: string;
}> = ({ link, text }) => {
  const router = useRouter();
  return (
    <DashboardButtonWrapper
      onClick={() => {
        router.push(link);
      }}
    >
      <Typography fs={16} lh={20} fw="MEDIUM">
        {text}
      </Typography>
      <Icon type="chevron_right" size={20} color={colors.BLACK} />
    </DashboardButtonWrapper>
  );
};

export default DashboardButton;
