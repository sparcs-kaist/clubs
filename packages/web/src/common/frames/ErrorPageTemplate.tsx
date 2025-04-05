"use client";

import Image from "next/image";
import React from "react";
import styled from "styled-components";

import logoImg from "@sparcs-clubs/web/assets/only-logo.svg";

import Button from "../components/Button";
import Typography from "../components/Typography";

export interface ErrorPageTemplateProps
  extends React.HTMLAttributes<HTMLDivElement> {
  message?: React.ReactNode;
  buttons?: { text: string; onClick: () => void }[];
}

// min-height: ResponsiveContent의 min-height
const ResponsiveWrapper = styled.div`
  display: flex;
  width: 100%;
  height: 100%;
  min-height: calc(100vh - 105px - 160px);
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 20px;
  flex: 1 0 0;
  position: relative;

  @media (max-width: ${({ theme }) => theme.responsive.BREAKPOINT.md}) {
    min-height: calc(100vh - 105px - 80px);
  }
  @media (max-width: ${({ theme }) => theme.responsive.BREAKPOINT.sm}) {
    min-height: calc(100vh - 105px - 40px);
  }
  @media (max-width: ${({ theme }) => theme.responsive.BREAKPOINT.xs}) {
    align-self: stretch;
  }
`;

const ContentsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 20px;
  position: absolute;
  opacity: 1;
  width: 100%;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 2;
`;

const ButtonsWrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: flex-start;
  gap: 10px 20px;
  flex-wrap: wrap;
`;

// height: 원 모양의 높이
const LogoFrame = styled.div`
  display: flex;
  width: 100%;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  gap: 0px;
  position: absolute;
  opacity: 1;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  height: 385px;
  z-index: 1;

  @media (max-width: ${({ theme }) => theme.responsive.BREAKPOINT.sm}) {
    height: 283px;
  }
  @media (max-width: ${({ theme }) => theme.responsive.BREAKPOINT.xs}) {
    height: 183px;
  }
`;

const LogoImage = styled(Image)`
  width: 600px;
  height: 450px;
  flex-shrink: 0;
  opacity: 0.3;
  max-width: calc(100vw - 20px);

  @media (max-width: ${({ theme }) => theme.responsive.BREAKPOINT.sm}) {
    width: 438px;
    height: 329px;
  }
  @media (max-width: ${({ theme }) => theme.responsive.BREAKPOINT.xs}) {
    width: 284px;
    height: 213px;
  }
`;

// height: (LogoImage의 높이) - (LogoFrame의 높이)
const BufferDiv = styled.div`
  width: 100%;
  height: 65px;
  background-color: rgba(255, 0, 0, 0.5);
  @media (max-width: ${({ theme }) => theme.responsive.BREAKPOINT.sm}) {
    height: 56px;
  }
  @media (max-width: ${({ theme }) => theme.responsive.BREAKPOINT.xs}) {
    height: 30px;
  }
`;

const ErrorPageTemplate: React.FC<ErrorPageTemplateProps> = ({
  message = <Typography>&nbsp;</Typography>,
  buttons = [],
}) => (
  <ResponsiveWrapper>
    <ContentsWrapper>
      {message}
      <ButtonsWrapper>
        {buttons.map((button: { text: string; onClick: () => void }, index) => (
          <Button key={`${index.toString()}`} onClick={button.onClick}>
            {button.text}
          </Button>
        ))}
      </ButtonsWrapper>
    </ContentsWrapper>
    <LogoFrame>
      <BufferDiv />
      <LogoImage src={logoImg} alt="Clubs Logo" />
    </LogoFrame>
  </ResponsiveWrapper>
);

export default ErrorPageTemplate;
