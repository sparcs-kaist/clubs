"use client";

import isPropValid from "@emotion/is-prop-valid";
import React, { cloneElement, ReactElement, ReactNode } from "react";
import styled from "styled-components";

import Label from "@sparcs-clubs/web/common/components/FormLabel";

import RadioOption, { type RadioOptionProps } from "./RadioOption";

type RadioProps<T extends string> = {
  children: ReactElement<RadioOptionProps<T>>[];
  value: T;
  onChange: (value: T) => void;
  label?: string;
  direction?: "row" | "column";
  gap?: string;
};

function isRadioOptionElement<T extends string>(
  child: ReactNode,
): child is ReactElement<RadioOptionProps<T>> {
  return React.isValidElement(child) && "value" in child.props;
}

const RadioWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
`;

const StyledRadioInner = styled.div.withConfig({
  shouldForwardProp: prop => isPropValid(prop),
})<{
  direction: "row" | "column";
  gap: string;
}>`
  display: flex;
  flex-direction: ${({ direction }) => direction};
  gap: ${({ gap }) => gap};
`;

const Radio = <T extends string>({
  direction = "column",
  gap = "12px",
  value,
  onChange,
  label = "",
  children,
}: RadioProps<T>) => {
  const handleChange = (newValue: T) => {
    if (newValue !== value) {
      onChange(newValue);
    }
  };

  return (
    <RadioWrapper>
      {label && <Label>{label}</Label>}
      <StyledRadioInner direction={direction} gap={gap}>
        {React.Children.map(children, child => {
          if (isRadioOptionElement<T>(child)) {
            return cloneElement(child, {
              checked: child.props.value === value,
              onClick: () => handleChange(child.props.value),
            });
          }
          return child;
        })}
      </StyledRadioInner>
    </RadioWrapper>
  );
};
Radio.Option = RadioOption;

export default Radio;
