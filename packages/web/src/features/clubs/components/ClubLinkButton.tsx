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
  background: white;
  border-radius: 50px;
  border: 1px solid #dddddd;
  display: inline-flex;
  justify-content: flex-start;
  align-items: center;
  gap: 40px;
  cursor: pointer;

  &:hover {
    background: #f4fafa;
    outline: 1px solid #0099ad;
    outline-offset: -1px;
  }

  &[data-property-1="default"] {
    background: white;
    border: 1px solid #dddddd;
  }

  &[data-property-1="hovering"] {
    background: #f4fafa;
    outline: 1px solid #0099ad;
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

  color: #333333;
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
  <ButtonContainer
    onClick={() => window.open(link, "_blank")}
    data-property-1="default"
  >
    <IconWrapper>
      <Image src={icon} alt={`${title} Icon`} width={30} height={30} />
    </IconWrapper>
    <TextWrapper>{title}</TextWrapper>
  </ButtonContainer>
);

export default ClubLinkButton;
