import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfWeek,
} from "date-fns";
import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import styled from "styled-components";

import type { OfficeHour } from "@clubs/interface/api/office-hours";

import Button from "@sparcs-clubs/web/common/components/Button";
import Card from "@sparcs-clubs/web/common/components/Card";
import { formatTime } from "@sparcs-clubs/web/utils/Date/formatDate";
import { getLocalDateOnly } from "@sparcs-clubs/web/utils/Date/getKSTDate";

const CalendarCard = styled(Card)`
  padding: 20px;

  @media (max-width: ${({ theme }) => theme.responsive.BREAKPOINT.sm}) {
    padding: 8px;
  }
`;

const MonthControls = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
  margin-bottom: 16px;

  button {
    padding-inline: 8px;
  }

  strong {
    font-weight: ${({ theme }) => theme.fonts.WEIGHT.SEMIBOLD};
  }
`;

const CalendarGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 4px;

  @media (max-width: ${({ theme }) => theme.responsive.BREAKPOINT.sm}) {
    gap: 2px;
  }
`;

const Weekday = styled.span`
  text-align: center;
  color: ${({ theme }) => theme.colors.GRAY[600]};
  padding-bottom: 6px;
  font-size: 13px;
`;

const DayCell = styled.div<{ $selected?: boolean }>`
  display: flex;
  flex-direction: column;
  min-height: 72px;
  gap: 4px;
  border: 1px solid
    ${({ theme, $selected }) =>
      $selected ? theme.colors.PRIMARY : theme.colors.GRAY[200]};
  border-radius: 4px;
  padding: 6px;
  text-align: start;
  color: inherit;
  background-color: ${({ theme, $selected }) =>
    $selected ? theme.colors.MINT[100] : theme.colors.WHITE};

  &:is(button) {
    cursor: pointer;
  }

  &:is(button):hover,
  &:focus-visible {
    border-color: ${({ theme }) => theme.colors.PRIMARY};
  }

  @media (max-width: ${({ theme }) => theme.responsive.BREAKPOINT.sm}) {
    padding: 3px 2px;
    font-size: 13px;
  }
`;

const DayStatus = styled.span<{ $closed?: boolean }>`
  display: flex;
  flex-wrap: wrap;
  column-gap: 2px;
  font-size: 12px;
  line-height: 16px;
  color: ${({ theme, $closed }) =>
    $closed ? theme.colors.RED[600] : theme.colors.MINT[800]};
`;

interface OfficeHoursCalendarProps {
  month: Date;
  items: OfficeHour[];
  selectedDate?: string;
  onMonthChange: (month: Date) => void;
  onDateSelect?: (date: string) => void;
  children?: ReactNode;
}

const OfficeHoursCalendar = ({
  month,
  items,
  selectedDate,
  onMonthChange,
  onDateSelect,
  children,
}: OfficeHoursCalendarProps) => {
  const t = useTranslations("officeHours");
  const locale = useLocale();
  const days = eachDayOfInterval({
    start: startOfWeek(month),
    end: endOfWeek(endOfMonth(month)),
  });
  const weekdayFormatter = new Intl.DateTimeFormat(locale, {
    weekday: "short",
  });
  const monthLabel = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
  }).format(month);
  const today = format(getLocalDateOnly(new Date()), "yyyy-MM-dd");
  const byDate = new Map(items.map(item => [item.date, item]));

  return (
    <CalendarCard outline>
      <MonthControls>
        <Button
          type="outlined"
          aria-label={t("previousMonth")}
          onClick={() => onMonthChange(addMonths(month, -1))}
        >
          <span aria-hidden>‹</span>
        </Button>
        <strong aria-live="polite">{monthLabel}</strong>
        <Button
          type="outlined"
          aria-label={t("nextMonth")}
          onClick={() => onMonthChange(addMonths(month, 1))}
        >
          <span aria-hidden>›</span>
        </Button>
      </MonthControls>
      {children}
      <CalendarGrid>
        {days.slice(0, 7).map(day => (
          <Weekday key={day.getDay()}>{weekdayFormatter.format(day)}</Weekday>
        ))}
        {days.map(day => {
          const date = format(day, "yyyy-MM-dd");
          if (!isSameMonth(day, month)) return <div aria-hidden key={date} />;

          const officeHour = byDate.get(date);
          const statusId = `office-hours-${date}`;
          const label = (
            <>
              <time
                dateTime={date}
                aria-current={date === today ? "date" : undefined}
              >
                {day.getDate()}
              </time>
              {officeHour?.isClosed && (
                <DayStatus id={statusId} $closed>
                  {t("closed")}
                </DayStatus>
              )}
              {officeHour && !officeHour.isClosed && (
                <DayStatus id={statusId}>
                  <span>{formatTime(new Date(officeHour.opensAt))}–</span>
                  <span>{formatTime(new Date(officeHour.closesAt))}</span>
                </DayStatus>
              )}
            </>
          );

          return onDateSelect ? (
            <DayCell
              as="button"
              type="button"
              key={date}
              $selected={selectedDate === date}
              aria-pressed={selectedDate === date}
              aria-label={date}
              aria-describedby={officeHour ? statusId : undefined}
              onClick={() => onDateSelect(date)}
            >
              {label}
            </DayCell>
          ) : (
            <DayCell key={date}>{label}</DayCell>
          );
        })}
      </CalendarGrid>
    </CalendarCard>
  );
};

export default OfficeHoursCalendar;
