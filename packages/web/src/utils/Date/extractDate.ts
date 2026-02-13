import { toZonedTime } from "date-fns-tz";

const KST = "Asia/Seoul";

export const getActualYear = (date: Date | string) =>
  toZonedTime(new Date(date), KST).getFullYear();

export const getActualMonth = (date: Date | string) =>
  toZonedTime(new Date(date), KST).getMonth() + 1;
