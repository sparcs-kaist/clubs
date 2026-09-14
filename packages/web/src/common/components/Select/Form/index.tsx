import isPropValid from "@emotion/is-prop-valid";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import styled, { css } from "styled-components";

import FormError from "@sparcs-clubs/web/common/components/FormError";
import Label from "@sparcs-clubs/web/common/components/FormLabel";
import Icon from "@sparcs-clubs/web/common/components/Icon";

import NoOption from "../_atomic/NoOption";
import Dropdown from "../Dropdown";
import SelectOption from "../SelectOption";

export interface SelectItem<T> {
  label: string;
  value: T;
  selectable?: boolean;
}

interface SelectProps<T> {
  items: SelectItem<T>[];
  label?: string;
  errorMessage?: string;
  disabled?: boolean;
  value: T;
  onChange?: (value: T) => void;
  onBlur?: () => void;
  placeholder?: string;
}

const SelectInner = styled.div`
  gap: 4px;
  position: relative;
`;

const disabledStyle = css`
  background-color: ${({ theme }) => theme.colors.GRAY[100]};
  border-color: ${({ theme }) => theme.colors.GRAY[200]};
  color: ${({ theme }) => theme.colors.GRAY[300]};
  pointer-events: none;
`;

const StyledSelect = styled.div.withConfig({
  shouldForwardProp: prop => isPropValid(prop),
})<{ hasError?: boolean; disabled?: boolean; isOpen?: boolean }>`
  width: 100%;
  padding: 8px 12px;
  outline: none;
  cursor: pointer;
  background-color: ${({ theme }) => theme.colors.WHITE};
  border: 1px solid
    ${({ theme, hasError, isOpen }) => {
      if (isOpen) return theme.colors.PRIMARY;
      return hasError ? theme.colors.RED[600] : theme.colors.GRAY[200];
    }};
  border-radius: 4px;
  font-family: ${({ theme }) => theme.fonts.FAMILY.PRETENDARD};
  font-size: 16px;
  line-height: 20px;
  font-weight: ${({ theme }) => theme.fonts.WEIGHT.REGULAR};

  &:focus,
  &:hover:not(:focus) {
    border-color: ${({ theme, isOpen }) =>
      isOpen ? theme.colors.PRIMARY : theme.colors.GRAY[300]};
  }

  ${({ disabled }) => disabled && disabledStyle}
`;

const IconWrapper = styled.div`
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
`;

const SelectWrapper = styled.div`
  width: 100%;
  flex-direction: column;
  display: flex;
  gap: 4px;
`;

const SelectValue = styled.span.withConfig({
  shouldForwardProp: prop => isPropValid(prop),
})<{ isSelected: boolean; disabled: boolean }>`
  color: ${({ theme, isSelected, disabled }) => {
    if (disabled) {
      return theme.colors.GRAY[300];
    }
    if (isSelected) {
      return theme.colors.BLACK;
    }
    return theme.colors.GRAY[200];
  }};
`;

const FormSelect = <T,>({
  items,
  errorMessage = "",
  label = "",
  disabled = false,
  value,
  onChange = () => {},
  onBlur = () => {},
  placeholder,
}: SelectProps<T>) => {
  const t = useTranslations("common");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        if (isOpen) {
          onBlur();
          setIsOpen(false);
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [containerRef, isOpen, items.length, onBlur, value]);

  const handleSelectClick = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleOptionClick = (item: SelectItem<T>) => {
    if (item.selectable || item.selectable === undefined) {
      onChange(item.value);
      setIsOpen(false);
    }
  };

  const selectedLabel =
    items.find(item => item.value === value)?.label ||
    placeholder ||
    t("forms.selectPlaceholder");

  return (
    <SelectWrapper>
      {label && <Label>{label}</Label>}
      <SelectWrapper>
        <SelectInner ref={containerRef}>
          <StyledSelect
            hasError={errorMessage.length > 0}
            disabled={disabled}
            onClick={handleSelectClick}
            isOpen={isOpen}
          >
            <SelectValue
              isSelected={value != null && value !== ""}
              disabled={disabled}
            >
              {selectedLabel}
            </SelectValue>
            <IconWrapper>
              {isOpen ? (
                <Icon type="keyboard_arrow_up" size={20} />
              ) : (
                <Icon type="keyboard_arrow_down" size={20} />
              )}
            </IconWrapper>
          </StyledSelect>
          {isOpen && (
            <Dropdown marginTop={4}>
              {items.length > 0 ? (
                items.map(item => (
                  <SelectOption
                    key={item.value as string}
                    selectable={
                      item.selectable || item.selectable === undefined
                    }
                    onClick={() => handleOptionClick(item)}
                  >
                    {item.label}
                  </SelectOption>
                ))
              ) : (
                <NoOption>{t("forms.noOptions")}</NoOption>
              )}
            </Dropdown>
          )}
        </SelectInner>
        {errorMessage.length > 0 && <FormError>{errorMessage}</FormError>}
      </SelectWrapper>
    </SelectWrapper>
  );
};

export default FormSelect;
