import "react-datepicker/dist/react-datepicker.css";
import React, { useRef } from "react";
import DatePicker, { DatePickerProps } from "react-datepicker";
import styled from "styled-components";

import FlexWrapper from "../FlexWrapper";
import Icon from "../Icon";
import Typography from "../Typography";

interface DateInputProps {
  label?: string;
  disabled?: boolean;
  errorMessage?: string;
  showIcon?: boolean;
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
    padding: 0px;
  }
`;

const DateInput: React.FC<
  DateInputProps & Omit<DatePickerProps, "showIcon">
> = ({
  label = "",
  disabled = false,
  errorMessage = "",
  showIcon = false,
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
    <FlexWrapper direction="column" gap={4} style={{ width: "100%" }}>
      {label.length > 0 && (
        <Typography ff="PRETENDARD" fw="MEDIUM" fs={16} lh={20} color="BLACK">
          {label}
        </Typography>
      )}
      <DateInputWrapper disabled={disabled} onClick={handleInputClick}>
        <DatePicker
          ref={datePickerRef}
          disabled={disabled}
          dateFormat={props.showTimeInput ? "yyyy.MM.dd HH:mm" : "yyyy.MM.dd"}
          placeholderText={
            props.showTimeInput ? "20XX.XX.XX XX:XX" : "20XX.XX.XX"
          }
          {...props}
        />
        {showIcon && (
          <Icon type="event" size={20} color={disabled ? "#DDDDDD" : "BLACK"} />
        )}
      </DateInputWrapper>
      {errorMessage.length > 0 && (
        <Typography ff="PRETENDARD" fs={12} lh={16} color="RED.600">
          {errorMessage}
        </Typography>
      )}
    </FlexWrapper>
  );
};

export default DateInput;
