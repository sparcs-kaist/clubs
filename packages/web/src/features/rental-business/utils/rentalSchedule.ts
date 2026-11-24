import { formatInTimeZone } from "date-fns-tz";

import type {
  RentalDuration,
  RentalSlotSelection,
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
  const lastDay = Date.parse("9999-12-31T00:00:00Z");
  const result = new Date(
    Math.min(Date.parse(`${date}T00:00:00Z`) + days * 86_400_000, lastDay),
  );
  return result.toISOString().slice(0, 10);
};

export const formatRentalDate = (date: string) =>
  dateLabel.format(new Date(`${date}T00:00:00+09:00`));

export const formatRentalSlot = ({
  date,
  opensAt,
  closesAt,
}: RentalSlotSelection) =>
  `${formatRentalDate(date)} ${timeLabel.format(new Date(opensAt))}–${timeLabel.format(new Date(closesAt))}`;

export const rentalSlotSelection = ({
  date,
  opensAt,
  closesAt,
}: RentalSlotSelection): RentalSlotSelection => ({ date, opensAt, closesAt });

export const isSameRentalSlot = (
  a: RentalSlotSelection,
  b: RentalSlotSelection,
) => a.date === b.date && a.opensAt === b.opensAt && a.closesAt === b.closesAt;

export const formatRentalInstant = (date: string) =>
  formatInTimeZone(new Date(date), timeZone, "yyyy-MM-dd HH:mm");

export const formatRentalDuration = ({
  durationType,
  durationValue,
}: RentalDuration) =>
  durationType === "DAYS"
    ? `수령일부터 최대 ${durationValue}일`
    : `수령 후 ${durationValue}번째 상근일까지`;
