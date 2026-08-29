const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

export const Weekday = {
  Sunday: 0,
  Monday: 1,
  Friday: 5,
  Saturday: 6,
} as const;

export const getKSTDay = (date: Date): number =>
  new Date(date.getTime() + KST_OFFSET_MS).getUTCDay();

export const areSemesterTermWeekdaysValid = (
  startTerm: Date,
  endTerm: Date,
): boolean =>
  getKSTDay(startTerm) === Weekday.Monday &&
  getKSTDay(endTerm) === Weekday.Sunday;

export const areRegularActivityDurationTermWeekdaysValid = (
  startTerm: Date,
  endTerm: Date,
): boolean =>
  getKSTDay(startTerm) === Weekday.Saturday &&
  getKSTDay(endTerm) === Weekday.Friday;
