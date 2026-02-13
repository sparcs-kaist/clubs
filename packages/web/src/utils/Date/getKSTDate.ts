import { toZonedTime } from "date-fns-tz";

const KST = "Asia/Seoul";

/**
 * @description 각종 시간 표시에 대한 포매팅 함수
 * @description 로컬 기준으로 만들어 줌 (UTC 기준이 아님)
 * @example 2024.01.01 -> 2024-01-01T00:00:00
 * @example 2024-01-01 -> 2024-01-01T00:00:00
 * @example 2024-01-01T00:00:00 -> 2024-01-01T00:00:00
 */
export const formatLocalDateString = (dateString: string): string => {
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(dateString)) {
    return dateString;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return `${dateString}T00:00:00`;
  }
  if (/^\d{4}\.\d{2}\.\d{2}$/.test(dateString)) {
    return `${dateString.replaceAll(".", "-")}T00:00:00`;
  }
  throw new Error("Invalid date string");
};

/**
 * @description date를 입력했을 때 시간을 제외한 년, 월, 일만 남기고 Date 타입으로 반환 (KST 기준)
 * @example 2024-01-01T00:00:00Z -> 2024-01-01T00:00:00 (KST)
 */
export const getLocalDateOnly = (date: Date | string): Date => {
  const dateInput = typeof date === "string" ? new Date(date) : date;
  const kst = toZonedTime(dateInput, KST);
  return new Date(kst.getFullYear(), kst.getMonth(), kst.getDate());
};

/**
 * @description KST 기준 23시 59분 00초를 return
 * @description 활동보고서 활동 기간을 위해서 사용
 * @example 2024-01-01T00:00:00Z -> 2024-01-01T23:59:00 (KST)
 */
export const getLocalDateLastTime = (date: Date | string): Date => {
  const dateInput = typeof date === "string" ? new Date(date) : date;
  const kst = toZonedTime(dateInput, KST);

  return new Date(kst.getFullYear(), kst.getMonth(), kst.getDate(), 23, 59, 0);
};
