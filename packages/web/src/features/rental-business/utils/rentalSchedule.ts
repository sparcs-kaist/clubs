import { formatInTimeZone } from "date-fns-tz";

import type {
  RentalPeriodPolicy,
  RentalSlot,
} from "@clubs/interface/api/rental/v2";

const timeZone = "Asia/Seoul";
const dateLabel = new Intl.DateTimeFormat("ko-KR", {
  timeZone,
  month: "long",
  day: "numeric",
  weekday: "short",
});
const timeLabel = new Intl.DateTimeFormat("ko-KR", {
  timeZone,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export const todayRentalDate = () =>
  formatInTimeZone(new Date(), timeZone, "yyyy-MM-dd");

export const addRentalDays = (date: string, days: number) => {
  const result = new Date(`${date}T00:00:00Z`);
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString().slice(0, 10);
};

export const formatRentalDate = (date: string) =>
  dateLabel.format(new Date(`${date}T00:00:00+09:00`));

export const formatRentalSlot = ({
  date,
  opensAt,
  closesAt,
}: Pick<RentalSlot, "date" | "opensAt" | "closesAt">) =>
  `${formatRentalDate(date)} ${timeLabel.format(new Date(opensAt))}–${timeLabel.format(new Date(closesAt))}`;

export const formatRentalInstant = (date: string) =>
  formatInTimeZone(new Date(date), timeZone, "yyyy-MM-dd HH:mm");

export const rentalPolicyLabels: Record<RentalPeriodPolicy, string> = {
  DAYS_14: "수령일부터 최대 14일",
  SECOND_NEXT_OFFICE_HOUR: "수령 후 두 번째 상근일까지",
};
