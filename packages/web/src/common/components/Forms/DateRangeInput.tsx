import { isValid, parse } from "date-fns";
import { ko } from "date-fns/locale";
import React, { ChangeEvent, useEffect, useState } from "react";
import styled from "styled-components";

import TextInput, {
  TextInputProps,
} from "@sparcs-clubs/web/common/components/Forms/TextInput";

import FormError from "../FormError";
import Typography from "../Typography";

interface DateRangeInputProps extends Omit<
  TextInputProps,
  "onChange" | "label"
> {
  label?: [start: string, end: string];
  startValue: string;
  endValue: string;
  limitStartValue: string;
  limitEndValue: string;
  onChange: (value: string) => void;
  isTextAlignCenter?: boolean;
  useDays?: boolean; // New prop to include days
}

const DateRangeInputErrorFrameInner = styled.div`
  min-width: 300px;
  display: flex;
  flex-direction: column;
  flex: 1;
`;

const DateRangeInputFrameInner = styled.div`
  justify-content: flex-start;
  align-items: end;
  gap: 12px;
  display: flex;
`;

const DateRangeInput: React.FC<DateRangeInputProps> = ({
  label = ["", ""],
  startValue,
  endValue,
  limitStartValue,
  limitEndValue,
  onChange,
  useDays = false, // Default to false
  isTextAlignCenter = false,
  ...props
}) => {
  const maxLength = useDays ? 10 : 7;

  const [error, setError] = useState("");
  const [touched, setTouched] = useState(false);
  const [startEndMonth, setStartEndMonth] = useState("|");

  useEffect(() => {
    if (touched) {
      const dateFormat = useDays ? /^(\d{4}-\d{2}-\d{2})$/ : /^(\d{4}-\d{2})$/;
      const isValidFormat =
        (dateFormat.test(startValue) ||
          /^\d*$/.test(startValue.replace(/./g, ""))) &&
        (dateFormat.test(endValue) || /^\d*$/.test(endValue.replace(/./g, "")));

      const isValidDate = (date: string) => {
        const parsed = useDays
          ? parse(date, "yyyy.MM.dd", new Date(), { locale: ko })
          : parse(date, "yyyy.MM", new Date(), { locale: ko });
        return isValid(parsed);
      };
      if (!startValue) {
        setError("시작 기간을 입력하지 않았습니다");
      } else if (!isValidFormat) {
        setError("입력 기간이 올바르지 않습니다");
      } else if (
        !(startValue.length === maxLength) ||
        !(endValue.length === maxLength)
      ) {
        setError("입력 기간이 올바르지 않습니다");
      } else if (!isValidDate(startValue) || !isValidDate(endValue)) {
        setError("유효하지 않은 날짜입니다");
      } else if (!endValue) {
        setError("끝 기간을 입력하지 않았습니다");
      } else if (
        new Date(startValue).getTime() > new Date(endValue).getTime()
      ) {
        setError("종료일은 시작일보다 빠를 수 없습니다");
      } else if (
        new Date(startValue).getTime() < new Date(limitStartValue).getTime() ||
        new Date(limitEndValue).getTime() < new Date(startValue).getTime() ||
        new Date(endValue).getTime() < new Date(limitStartValue).getTime() ||
        new Date(limitEndValue).getTime() < new Date(endValue).getTime()
      ) {
        setError("입력 가능 범위를 벗어났습니다");
      } else {
        setError("");
      }
    }
  }, [startValue, endValue, touched, useDays]);
  const handleBlur = () => {
    setTouched(true);
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    isStartOrEnd: "start" | "end",
  ) => {
    const inputValue = e.target.value;
    if (inputValue.length <= maxLength) {
      if (isStartOrEnd === "start") {
        setStartEndMonth(
          inputValue.concat("|").concat(startEndMonth.split("|")[1]),
        );
        onChange(inputValue.concat("|").concat(startEndMonth.split("|")[1]));
      } else {
        setStartEndMonth(
          startEndMonth.split("|")[0].concat("|").concat(inputValue),
        );
        onChange(startEndMonth.split("|")[0].concat("|").concat(inputValue));
      }
    }
  };

  const formatValue = (nums: string) => {
    const digits = nums.replace(/\D/g, "");
    let formattedInput = "";

    if (digits.length <= 4) {
      formattedInput = digits;
    } else if (digits.length <= 6) {
      formattedInput = `${digits.slice(0, 4)}.${digits.slice(4)}`;
    } else if (digits.length <= 8 && useDays) {
      formattedInput = `${digits.slice(0, 4)}.${digits.slice(4, 6)}.${digits.slice(6)}`;
    }

    return formattedInput;
  };

  return (
    <DateRangeInputErrorFrameInner>
      <DateRangeInputFrameInner>
        <TextInput
          label={label[0]}
          value={formatValue(startValue)}
          onChange={e => handleChange(e, "start")}
          errorMessage={error ? " " : ""}
          onBlur={handleBlur}
          isTextAlignCenter={isTextAlignCenter}
          {...props}
        />

        <Typography
          style={error ? { marginBottom: "4px" } : {}}
          fs={16}
          lh={38}
          fw="REGULAR"
        >
          ~
        </Typography>

        <TextInput
          label={label[1]}
          value={formatValue(endValue)}
          onChange={e => handleChange(e, "end")}
          errorMessage={error ? " " : ""}
          onBlur={handleBlur}
          isTextAlignCenter={isTextAlignCenter}
          {...props}
        />
      </DateRangeInputFrameInner>
      {error && <FormError>{error}</FormError>}
    </DateRangeInputErrorFrameInner>
  );
};
// TODO: DB 값 default로 넣어두기

export default DateRangeInput;
