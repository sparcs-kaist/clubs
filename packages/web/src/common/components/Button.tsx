"use client";

import React, { HTMLAttributes } from "react";
import styled from "styled-components";

export type ButtonProps = {
  buttonType?: "button" | "reset" | "submit";
  type?: keyof typeof ButtonTypeInner;
  children: React.ReactNode;
} & HTMLAttributes<HTMLButtonElement>;

const ButtonInner = styled.button`
  display: inline-flex;
  padding: 8px 16px;
  justify-content: center;
  align-items: center;
  border-radius: 4px;
  font-family: ${({ theme }) => theme.fonts.FAMILY.PRETENDARD};
  font-size: 16px;
  line-height: 20px;
  font-weight: ${({ theme }) => theme.fonts.WEIGHT.MEDIUM};
  flex-shrink: 0;
`;

const ButtonDefaultInner = styled(ButtonInner)`
  color: ${({ theme }) => theme.colors.WHITE};
  background: ${({ theme }) => theme.colors.PRIMARY};
  cursor: pointer;
  &:hover {
    background: ${({ theme }) => theme.colors.MINT[800]};
  }
`;

const ButtonOutlinedInner = styled(ButtonInner)`
  border: 1px solid ${({ theme }) => theme.colors.GRAY[200]};
  background: ${({ theme }) => theme.colors.WHITE};
  cursor: pointer;
  &:hover {
    border: 1px solid ${({ theme }) => theme.colors.GRAY[300]};
  }
`;

const ButtonDangerInner = styled(ButtonInner)`
  color: ${({ theme }) => theme.colors.WHITE};
  background: ${({ theme }) => theme.colors.RED[600]};
  cursor: pointer;
  &:hover {
    filter: brightness(0.9);
  }
`;

const ButtonDisabledInner = styled(ButtonInner)`
  color: ${({ theme }) => theme.colors.GRAY[300]};
  border: 1px solid ${({ theme }) => theme.colors.GRAY[300]};
  background: ${({ theme }) => theme.colors.GRAY[100]};
  cursor: not-allowed;
`;

const ButtonTypeInner = {
  default: ButtonDefaultInner,
  outlined: ButtonOutlinedInner,
  danger: ButtonDangerInner,
  disabled: ButtonDisabledInner,
};

const Button = ({
  type = "default",
  buttonType = "button",
  children,
  ...divProps
}: ButtonProps) => {
  const ButtonChosenInner = ButtonTypeInner[type];
  return (
    <ButtonChosenInner
      {...divProps}
      type={buttonType}
      disabled={type === "disabled"}
      onClick={type === "disabled" ? undefined : divProps.onClick}
    >
      {children}
    </ButtonChosenInner>
  );
};

export default Button;
