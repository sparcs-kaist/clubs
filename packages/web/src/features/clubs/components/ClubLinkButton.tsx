"use client";

import React from "react";
import styled, { useTheme } from "styled-components";

import Typography from "@sparcs-clubs/web/common/components/Typography";

interface ClubLinkButtonProps {
  title: string;
  link: string;
  icon: React.ElementType;
}

const ButtonContainer = styled.div`
  width: 100%;
  height: 100%;
  padding: 16px 40px;
  background: ${({ theme }) => theme.colors.WHITE};
  border-radius: 50px;
  border: 1px solid ${({ theme }) => theme.colors.GRAY[300]};
  display: inline-flex;
  justify-content: flex-start;
  align-items: center;
  gap: 40px;
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.MINT[100]};
    outline: 1px solid ${({ theme }) => theme.colors.PRIMARY};
    outline-offset: -1px;
  }
`;

const IconWrapper = styled.div`
  display: flex;
  width: 30px;
  height: 30px;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 10px;
`;

const ContextWrapper = styled.div`
  display: flex;
  height: 28px;
  flex-direction: column;
  justify-content: center;
  flex: 1 0 0;

  ${ButtonContainer}:hover & {
    line-height: 28px;
  }
`;

const ClubLinkButton: React.FC<ClubLinkButtonProps> = ({
  title,
  link,
  icon: IconComponent,
}) => {
  const theme = useTheme();
  return (
    <ButtonContainer onClick={() => window.open(link, "_blank")}>
      <IconWrapper>
        <IconComponent
          style={{ fill: theme.colors.PRIMARY, width: "30px", height: "30px" }}
        />
      </IconWrapper>
      <ContextWrapper>
        <Typography
          style={{
            color: "theme.colors.PRIMARY",
            textAlign: "center",
            fontFamily: "Pretendard",
            fontSize: "16px",
            fontWeight: 400,
            lineHeight: "20px",
          }}
        >
          {title}
        </Typography>
      </ContextWrapper>
    </ButtonContainer>
  );
};

export default ClubLinkButton;
