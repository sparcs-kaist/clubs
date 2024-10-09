import React, { useRef } from "react";

import DatePicker, { DatePickerProps } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import styled from "styled-components";

import FlexWrapper from "../FlexWrapper";
import Icon from "../Icon";
import Typography from "../Typography";

interface DateInputProps {
  label?: string;
  disabled?: boolean;
}

const DateInputWrapper = styled.div<{ disabled: boolean }>`
  width: 100%;
  display: flex;
  flex-direction: row;
  border: 1px solid ${({ theme }) => theme.colors.GRAY[200]};
  border-radius: 4px;
  padding: 8px 12px;

  background-color: ${({ theme, disabled }) =>
    disabled ? theme.colors.GRAY[100] : theme.colors.WHITE};

  .react-datepicker-wrapper {
    width: 100%;
  }

  ::placeholder {
    opacity: 1;
    color: ${({ theme, disabled }) =>
      disabled ? theme.colors.GRAY[300] : theme.colors.GRAY[200]};
  }

  input {
    color: ${({ theme, disabled }) =>
      disabled ? theme.colors.GRAY[300] : theme.colors.BLACK};
    background-color: ${({ theme, disabled }) =>
      disabled ? theme.colors.GRAY[100] : theme.colors.WHITE};
    font-family: ${({ theme }) => theme.fonts.FAMILY.PRETENDARD};
    font-weight: ${({ theme }) => theme.fonts.WEIGHT.REGULAR};
    font-size: 16px;
    line-height: 20px;
    text-align: center;
    border: none;
    outline: none;
    width: 100%;
  }
`;

const DateInput: React.FC<DateInputProps & DatePickerProps> = ({
  label = "",
  disabled = false,
  ...props
}) => {
  const datePickerRef = useRef<DatePicker | null>(null);

  const handleInputClick = () => {
    if (
      datePickerRef.current &&
      !datePickerRef.current.calendar?.containerRef
    ) {
      datePickerRef.current.toggleCalendar();
    }
  };

  return (
    <FlexWrapper direction="column" gap={4}>
      {label.length > 0 && (
        <Typography ff="PRETENDARD" fw="MEDIUM" fs={16} lh={20} color="BLACK">
          {label}
        </Typography>
      )}
      <DateInputWrapper disabled={disabled} onClick={handleInputClick}>
        <DatePicker
          ref={datePickerRef}
          disabled={disabled}
          dateFormat="yyyy.MM.dd"
          placeholderText="20XX.XX.XX XX:XX"
          {...props}
        />
        <Icon type="event" size={20} color={disabled ? "#DDDDDD" : "BLACK"} />
      </DateInputWrapper>
    </FlexWrapper>
  );
};

export default DateInput;
