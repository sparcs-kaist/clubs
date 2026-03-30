import React from "react";
import styled from "styled-components";

import { Theme } from "@sparcs-clubs/web/styles/themes";
import colors from "@sparcs-clubs/web/styles/themes/colors";

type FontWeight = keyof Theme["fonts"]["WEIGHT"];
export type TextButtonColor = "PRIMARY" | "GRAY" | "BLACK";

interface ButtonProps {
  disabled: boolean;
  color: string;
  fs: number;
  fw: FontWeight;
}

const StyledTextButton = styled.button<ButtonProps>`
  background: none;
  border: none;
  color: ${({ color }) => color};
  cursor: ${({ disabled }) => (disabled ? "not-allowed" : "pointer")};
  font-size: ${({ fs }) => fs}px;
  line-height: 20px;
  @media (max-width: ${({ theme }) => theme.responsive.BREAKPOINT.sm}) {
    font-size: ${({ fs }) => fs * 0.875}px;
    line-height: 16px;
  }
  font-weight: ${({ theme, fw }) => theme.fonts.WEIGHT[fw]};
  font-family: ${({ theme }) => theme.fonts.FAMILY.PRETENDARD};
  text-decoration: underline;
  flex-shrink: 0;
  width: fit-content;
`;

interface TextButtonProps {
  text: string;
  disabled?: boolean;
  color?: TextButtonColor;
  fs?: number;
  fw?: FontWeight;
  onClick?: () => void;
}

const TextButton: React.FC<TextButtonProps> = ({
  text,
  disabled = false,
  color = "PRIMARY",
  fs = 16,
  fw = "MEDIUM",
  onClick = () => {},
}) => {
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    onClick();
  };

  const colorList = {
    disabled: colors.GRAY[300],
    PRIMARY: colors.PRIMARY,
    GRAY: colors.GRAY[600],
    BLACK: colors.BLACK,
  };

  const textColor = disabled ? colorList.disabled : colorList[color];

  return (
    <StyledTextButton
      disabled={disabled}
      onClick={handleClick}
      color={textColor}
      fs={fs}
      fw={fw}
      type="button"
    >
      {text}
    </StyledTextButton>
  );
};

export default TextButton;
