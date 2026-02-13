import { ko } from "date-fns/locale";
import { formatInTimeZone } from "date-fns-tz";

const KST = "Asia/Seoul";

const formatDate = (date: Date) =>
  formatInTimeZone(date, KST, "yyyy년 M월 d일 (iii)", { locale: ko });

const formatMonth = (date: Date) =>
  formatInTimeZone(date, KST, "yyyy년 M월", { locale: ko });

const formatSimpleSlashDate = (date: Date) =>
  formatInTimeZone(date, KST, "M/d(E)", { locale: ko });

const formatSimplerSlashDate = (date: Date) =>
  formatInTimeZone(date, KST, "M/d", { locale: ko });

const formatSlashDate = (date: Date) =>
  formatInTimeZone(date, KST, "MM/dd (E)", { locale: ko });

const formatDateTime = (date: Date) =>
  formatInTimeZone(date, KST, "yyyy년 M월 d일 (iii) HH:mm", { locale: ko });

const formatDateTimeEn = (date: Date) =>
  formatInTimeZone(date, KST, "MMM dd, yyyy (iii) HH:mm");

const formatSimpleDateTime = (date: Date) =>
  formatInTimeZone(date, KST, "yyyy년 M월 d일 HH:mm", { locale: ko });

const formatTime = (date: Date) =>
  formatInTimeZone(date, KST, "HH:mm", { locale: ko });

const formatSlashDateTime = (date: Date) =>
  formatInTimeZone(date, KST, "yyyy/MM/dd HH:mm", { locale: ko });

const formatDotDate = (date: Date) => formatInTimeZone(date, KST, "yyyy.MM.dd");

const formatDotSimpleDate = (date: Date) =>
  formatInTimeZone(date, KST, "yy.MM.dd", { locale: ko });

const formatDotDetailDate = (date: Date) =>
  formatInTimeZone(date, KST, "yyyy.MM.dd HH:mm", { locale: ko });

export {
  formatDate,
  formatDateTime,
  formatDateTimeEn,
  formatDotDate,
  formatDotDetailDate,
  formatDotSimpleDate,
  formatMonth,
  formatSimpleDateTime,
  formatSimplerSlashDate,
  formatSimpleSlashDate,
  formatSlashDate,
  formatSlashDateTime,
  formatTime,
};
