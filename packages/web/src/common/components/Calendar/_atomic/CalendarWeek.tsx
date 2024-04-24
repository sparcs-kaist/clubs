import React from "react";
import styled from "styled-components";
import CalendarDate, { CalendarDateProps } from "./CalendarDate";

interface CalendarWeekProps {
  week: {
    date: Date;
    exist: boolean;
    type?: CalendarDateProps["type"];
  }[];
  size?: CalendarDateProps["size"];
}

export interface CalendarSizeProps {
  size: CalendarDateProps["size"];
}

const WeekWrapper = styled.div<CalendarSizeProps>`
  display: flex;
  justify-content: space-evenly;
  align-items: center;
  width: ${({ size }) => {
    switch (size) {
      case "sm":
        return "296px";
      case "md":
        return "352px";
      case "lg":
      default:
        return "408px";
    }
  }};
`;

const CalendarWeek: React.FC<
  CalendarWeekProps & { onDateClick: (date: Date) => void }
> = ({ week, size = "lg", onDateClick }) => (
  <WeekWrapper size={size}>
    {week.map(day => (
      <CalendarDate
        key={day.date.toISOString()}
        date={day.date}
        exist={day.exist}
        type={day.type}
        size={size}
        onDateClick={onDateClick}
      />
    ))}
  </WeekWrapper>
);

export default CalendarWeek;
