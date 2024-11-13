import React, {
  ChangeEvent,
  InputHTMLAttributes,
  useEffect,
  useRef,
  useState,
} from "react";

import isPropValid from "@emotion/is-prop-valid";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import styled, { css } from "styled-components";

import FormError from "@sparcs-clubs/web/common/components/FormError";
import Label from "@sparcs-clubs/web/common/components/FormLabel";

export interface ItemNumberInputProps
  extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  placeholder: string;
  errorMessage?: string;
  disabled?: boolean;
  startDate?: Date;
  unit?: string;
  value?: string;
  handleChange?: (value: string) => void;
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
})<ItemNumberInputProps & { hasError: boolean }>`
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
  padding-right: ${({ startDate }) => (startDate ? "48px" : "12px")};

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
  value = "",
  startDate = new Date(),
  unit = "",
  handleChange = () => {},
  setErrorStatus = () => {},
  ...props
}) => {
  const [error, setError] = useState("");

  useEffect(() => {
    const isValidFormat = /^\d+$/g.test(value);
    if (value === "") {
      setError("");
      setErrorStatus(false);
    } else if (!isValidFormat) {
      setError("숫자만 입력 가능합니다");
      setErrorStatus(true);
    } else {
      setError("");

      setErrorStatus(false);
    }
  }, [value, setErrorStatus]);

  const handleValueChange = (e: ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value.replace(/[^0-9]/g, "");

    if (inputValue.length <= 2) {
      handleChange(inputValue);
    }
  };

  const displayValue = value ? `${value}` : "";
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
        <StyledInfoIcon
          style={{ fontSize: "16px", width: "16px", height: "16px" }}
        />
      </LabelWithIcon>
      <InputContainer>
        <Input
          ref={mainInputRef}
          onChange={handleValueChange}
          value={displayValue}
          placeholder={placeholder}
          disabled={disabled}
          hasError={!!error}
          onSelect={handleCursor}
          {...props}
        />
        {startDate !== undefined && (
          <RightContentWrapper hasError={!!error}>
            / {startDate}
            {unit}
          </RightContentWrapper>
        )}
      </InputContainer>
      {error && <FormError>{error}</FormError>}
    </InputWrapper>
  );
};

export default ItemNumberInput;
