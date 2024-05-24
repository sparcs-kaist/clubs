import { getKSTDate } from "@sparcs-clubs/api/common/util/util";
import { Reservation, TermList } from "../dto/common-space.dto";

export function getDayRange(date: Date): { dayStart: Date; dayEnd: Date } {
  const dayStart = getKSTDate(date);
  dayStart.setUTCHours(0, 0, 0, 0);

  const dayEnd = getKSTDate(date);
  dayEnd.setUTCHours(23, 59, 59, 999);

  return { dayStart, dayEnd };
}

export function getWeekRange(date: Date): { weekStart: Date; weekEnd: Date } {
  const dayOfWeek = date.getUTCDay();
  const diffToMonday = (dayOfWeek + 6) % 7;

  const weekStart = getKSTDate(date);
  weekStart.setUTCDate(date.getUTCDate() - diffToMonday);
  weekStart.setUTCHours(0, 0, 0, 0);

  const weekEnd = getKSTDate(weekStart);
  weekEnd.setUTCDate(weekStart.getUTCDate() + 6);
  weekEnd.setUTCHours(23, 59, 59, 999);

  return { weekStart, weekEnd };
}

export function calculateMinutes(start: Date, end: Date): number {
  return (end.getTime() - start.getTime()) / (60 * 1000);
}

export function splitReservationByDay(start: Date, end: Date): Reservation[] {
  const reservations: Reservation[] = [];
  let currentStart = getKSTDate(start);
  let currentEnd = getKSTDate(start);
  currentEnd.setUTCHours(23, 59, 59, 999);
  while (currentStart < end) {
    if (currentEnd > end) {
      currentEnd = getKSTDate(end);
    }

    reservations.push({
      start: getKSTDate(currentStart),
      end: getKSTDate(currentEnd),
    });

    currentStart = getKSTDate(currentEnd);
    currentStart.setUTCHours(0, 0, 0, 0);
    currentStart.setUTCDate(currentStart.getUTCDate() + 1);
    currentEnd = getKSTDate(currentStart);
    currentEnd.setUTCHours(23, 59, 59, 999);
  }

  return reservations;
}

export function splitReservationByWeek(start: Date, end: Date): Reservation[] {
  const reservations: Reservation[] = [];
  let currentStart = getKSTDate(start);
  let currentEnd = getWeekRange(currentStart).weekEnd;

  while (currentStart < end) {
    if (currentEnd > end) {
      currentEnd = getKSTDate(end);
    }

    reservations.push({
      start: getKSTDate(currentStart),
      end: getKSTDate(currentEnd),
    });

    currentStart = getKSTDate(currentEnd);
    currentStart.setUTCHours(0, 0, 0, 0);
    currentStart.setUTCDate(currentStart.getUTCDate() + 1);
    currentEnd = getWeekRange(currentStart).weekEnd;
  }

  return reservations;
}

export function canMakeReservation(
  startTerm: Date,
  endTerm: Date,
  existingReservations: Reservation[],
  availableMinutesPerDay: number,
  availableMinutesPerWeek: number,
): boolean {
  const newReservationsByDay = splitReservationByDay(startTerm, endTerm);
  const newReservationsByWeek = splitReservationByWeek(startTerm, endTerm);

  const dailyLimitExceeded = newReservationsByDay.some(newRes => {
    const { dayStart, dayEnd } = getDayRange(newRes.start);

    const dailyMinutes =
      existingReservations.reduce((total, res) => {
        if (res.start <= dayEnd && res.end >= dayStart) {
          const overlapStart = res.start < dayStart ? dayStart : res.start;
          const overlapEnd = res.end > dayEnd ? dayEnd : res.end;
          return total + calculateMinutes(overlapStart, overlapEnd);
        }
        return total;
      }, 0) + calculateMinutes(newRes.start, newRes.end);

    return dailyMinutes > availableMinutesPerDay;
  });

  if (dailyLimitExceeded) {
    return false;
  }

  const weeklyLimitExceeded = newReservationsByWeek.some(newRes => {
    const { weekStart, weekEnd } = getWeekRange(newRes.start);

    const weeklyMinutes =
      existingReservations.reduce((total, res) => {
        if (res.start <= weekEnd && res.end >= weekStart) {
          const overlapStart = res.start < weekStart ? weekStart : res.start;
          const overlapEnd = res.end > weekEnd ? weekEnd : res.end;
          return total + calculateMinutes(overlapStart, overlapEnd);
        }
        return total;
      }, 0) + calculateMinutes(newRes.start, newRes.end);

    return weeklyMinutes > availableMinutesPerWeek;
  });

  if (weeklyLimitExceeded) {
    return false;
  }

  return true;
}

export function periodicScheduleMake(
  commonSpaceId: number,
  clubId: number,
  chargeStudentId: number,
  studentPhoneNumber: string,
  startTime: number,
  endTime: number,
  startDate: Date,
  endDate: Date,
): TermList[] {
  const schedule: TermList[] = [];

  const startWeekday = Math.floor(startTime / 24);
  const startHour = startTime % 24;
  const endWeekday = Math.floor(endTime / 24);
  const endHour = endTime % 24;

  const currentStartDate = getKSTDate(startDate);
  let startOffset = startWeekday - currentStartDate.getUTCDay() + 1;
  if (startOffset < 0) {
    startOffset += 7;
  }
  currentStartDate.setUTCDate(currentStartDate.getUTCDate() + startOffset);
  currentStartDate.setUTCHours(startHour, 0, 0, 0);

  const currentEndDate = getKSTDate(startDate);
  let endOffset = endWeekday - currentStartDate.getUTCDay() + 1;
  if (endOffset < 0) {
    endOffset += 7;
  }
  currentEndDate.setUTCDate(currentEndDate.getUTCDate() + endOffset);
  currentEndDate.setUTCHours(endHour, 0, 0, 0);
  while (currentEndDate <= endDate) {
    schedule.push({
      commonSpaceId,
      clubId,
      chargeStudentId,
      studentPhoneNumber,
      startTerm: getKSTDate(currentStartDate),
      endTerm: getKSTDate(currentEndDate),
    });
    currentStartDate.setUTCDate(currentStartDate.getUTCDate() + 7);
    currentEndDate.setUTCDate(currentEndDate.getUTCDate() + 7);
  }
  return schedule;
}
