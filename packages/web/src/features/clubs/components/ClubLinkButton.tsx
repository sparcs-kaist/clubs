"use client";

import Image from "next/image";
import React from "react";
import styled from "styled-components";

interface ClubLinkButtonProps {
  title: string;
  link: string;
  icon: string;
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
  width: 30px;
  height: 30px;
  position: relative;
`;

const TextWrapper = styled.div`
  flex: 1 1 0;
  height: 28px;
  text-align: center;
  justify-content: center;
  display: flex;
  flex-direction: column;

  color: ${({ theme }) => theme.colors.BLACK};
  font-size: 16px;
  font-family: Pretendard, sans-serif;
  font-weight: 400;
  line-height: 20px;
  word-wrap: break-word;

  ${ButtonContainer}:hover & {
    line-height: 28px;
  }
`;

const ClubLinkButton: React.FC<ClubLinkButtonProps> = ({
  title,
  link,
  icon,
}) => (
  <ButtonContainer onClick={() => window.open(link, "_blank")}>
    <IconWrapper>
      <Image src={icon} alt={`${title} Icon`} width={30} height={30} />
    </IconWrapper>
    <TextWrapper>{title}</TextWrapper>
  </ButtonContainer>
);

export default ClubLinkButton;
