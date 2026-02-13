import isPropValid from "@emotion/is-prop-valid";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import React, {
  ChangeEvent,
  InputHTMLAttributes,
  useEffect,
  useRef,
  useState,
} from "react";
import styled, { css } from "styled-components";

import FormError from "../FormError";
import Label from "../FormLabel";
import { TextInputProps } from "./TextInput";

export interface ItemNumberInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "onChange"
> {
  label?: string;
  placeholder: string;
  disabled?: boolean;
  itemLimit?: number;
  unit?: string;
  value?: number;
  showIcon?: boolean;
  onChange: (value: number) => void;
  setErrorStatus?: (hasError: boolean) => void;
}

const LabelWithIcon = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const StyledInfoIcon = styled(InfoOutlinedIcon)`
  color: ${({ theme }) => theme.colors.GRAY[300]};
  cursor: pointer;
  font-size: 16px;
`;

const errorBorderStyle = css`
  border-color: ${({ theme }) => theme.colors.RED[600]};
`;

const disabledStyle = css`
  background-color: ${({ theme }) => theme.colors.GRAY[100]};
  border-color: ${({ theme }) => theme.colors.GRAY[200]};
`;

const InputContainer = styled.div`
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
`;

const RightContentWrapper = styled.div.withConfig({
  shouldForwardProp: prop => isPropValid(prop),
})<{ hasError: boolean }>`
  position: absolute;
  right: 12px;
  display: flex;
  align-items: center;
  pointer-events: none;
  font-family: ${({ theme }) => theme.fonts.FAMILY.PRETENDARD};
  font-size: 16px;
  line-height: 20px;
  font-weight: ${({ theme }) => theme.fonts.WEIGHT.REGULAR};
  color: ${({ theme, hasError }) =>
    hasError ? theme.colors.RED[600] : theme.colors.GRAY[300]};
`;

const Input = styled.input.withConfig({
  shouldForwardProp: prop => isPropValid(prop),
})<TextInputProps & { hasError: boolean; itemLimit: number }>`
  display: block;
  width: 100%;
  padding: 8px 12px;
  outline: none;
  border: 1px solid ${({ theme }) => theme.colors.GRAY[200]};
  border-radius: 4px;
  gap: 8px;
  font-family: ${({ theme }) => theme.fonts.FAMILY.PRETENDARD};
  font-size: 16px;
  line-height: 20px;
  font-weight: ${({ theme }) => theme.fonts.WEIGHT.REGULAR};
  color: ${({ theme }) => theme.colors.BLACK};
  background-color: ${({ theme }) => theme.colors.WHITE};
  padding-right: ${({ itemLimit }) => (itemLimit ? "48px" : "12px")};

  &:focus {
    border-color: ${({ theme, hasError, disabled }) =>
      !hasError && !disabled ? theme.colors.PRIMARY : undefined};
  }

  &:hover:not(:focus) {
    border-color: ${({ theme, hasError, disabled }) =>
      !hasError && !disabled ? theme.colors.GRAY[300] : undefined};
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.GRAY[200]};
  }

  ${({ disabled }) => disabled && disabledStyle}
  ${({ hasError }) => hasError && errorBorderStyle}
`;

const InputWrapper = styled.div`
  width: 100%;
  flex-direction: column;
  display: flex;
  gap: 4px;
`;

const ItemNumberInput: React.FC<ItemNumberInputProps> = ({
  label = "",
  placeholder,
  disabled = false,
  itemLimit = 99,
  value = undefined,
  unit = "개",
  showIcon = false,
  onChange,
  setErrorStatus = () => {},
}) => {
  const [error, setError] = useState("");

  useEffect(() => {
    const isValidFormat = /^\d+$/g.test(String(value));
    if (value === undefined) {
      setError("");
      setErrorStatus(false);
    } else if (!isValidFormat) {
      setError("숫자만 입력 가능합니다");
      setErrorStatus(true);
    } else if (value && value > itemLimit) {
      setError("신청 가능 개수를 초과했습니다");
      setErrorStatus(true);
    } else {
      setError("");
      setErrorStatus(false);
    }
  }, [value, itemLimit, setErrorStatus]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value.replace(/\D/g, "");
    if (inputValue.length <= 2) {
      onChange(Number(inputValue));
    }
  };

  const displayValue =
    value !== undefined && value !== 0 ? String(value) + unit : "";

  const mainInputRef = useRef<HTMLInputElement>(null);

  const handleCursor = () => {
    mainInputRef.current?.setSelectionRange(
      mainInputRef.current.selectionStart! >= displayValue.length
        ? displayValue.length - 1
        : mainInputRef.current.selectionStart,
      mainInputRef.current.selectionEnd! >= displayValue.length
        ? displayValue.length - 1
        : mainInputRef.current.selectionEnd,
    );
  };

  // TODO: 숫자가 아닌 것 입력했을 때 에러메시지

  return (
    <InputWrapper>
      <LabelWithIcon>
        {label && <Label>{label}</Label>}
        {showIcon && (
          <StyledInfoIcon
            style={{ fontSize: "16px", width: "16px", height: "16px" }}
          />
        )}
      </LabelWithIcon>
      <InputContainer>
        <Input
          ref={mainInputRef}
          onChange={handleChange}
          value={displayValue}
          placeholder={placeholder}
          disabled={disabled}
          hasError={!!error}
          onSelect={handleCursor}
          itemLimit={itemLimit}
        />
        {itemLimit !== undefined && (
          <RightContentWrapper hasError={!!error}>
            / {itemLimit}
            {unit}
          </RightContentWrapper>
        )}
      </InputContainer>
      {error && <FormError>{error}</FormError>}
    </InputWrapper>
  );
};

export default ItemNumberInput;
