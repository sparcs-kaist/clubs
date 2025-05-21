import React from "react";
import styled, { useTheme } from "styled-components";

import Typography from "@sparcs-clubs/web/common/components/Typography";
import useMediaQuery from "@sparcs-clubs/web/common/hooks/useMediaQuery";

const Container = styled.div<{ isMobile: boolean }>`
  position: absolute;
  top: ${({ isMobile }) => (isMobile ? "-8px" : "-1px")};
  right: -20px;
  background-color: ${({ theme }) => theme.colors.PRIMARY};
  border-radius: 4px;
  padding: 0 4px;
  cursor: default;
`;

const Beta: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(
    `(max-width: ${theme.responsive.BREAKPOINT.md})`,
  );
  return (
    <Container isMobile={isMobile}>
      <Typography fs={12} lh={14} color="WHITE">
        Beta
      </Typography>
    </Container>
  );
};

export default Beta;
